// Requires MongoDB replica-set transactions and unique indexes on _id.
// The caller provides a connected MongoClient; no local file or process memory is authoritative.
import { mongoCheckoutLimiter } from './checkout-rate-limit.mjs';
export function mongoReservationStore(client, databaseName = 'gua_shop') {
  const db = client.db(databaseName);
  const stock = db.collection('inventory');
  const reservations = db.collection('reservations');
  const orders = db.collection('orders');
  const mailOutbox = db.collection('mail_outbox');
  const paymentConflicts = db.collection('payment_conflicts');
  const withdrawals = db.collection('withdrawals');
  const limiter = mongoCheckoutLimiter(db);

  async function transact(work) {
    const session = client.startSession();
    try { return await session.withTransaction(() => work(session)); }
    finally { await session.endSession(); }
  }

  return {
    async authorizeWithdrawal(reference, email) {
      const job = await mailOutbox.findOne({ _id: reference }, { projection: { recipient: 1 } });
      return typeof job?.recipient === 'string' && job.recipient.toLowerCase() === email.toLowerCase();
    },
    async recordWithdrawal(id, withdrawal) {
      await withdrawals.insertOne({ _id: id, ...withdrawal, status: 'received', createdAt: new Date() });
    },
    async settleWithdrawal(id, status, details = {}) {
      if (!['confirmed', 'confirmation_pending'].includes(status)) throw new Error('INVALID_WITHDRAWAL_STATE');
      const result = await withdrawals.updateOne({ _id: id, status: 'received' }, { $set: { status, ...details, updatedAt: new Date() } });
      return result.modifiedCount === 1;
    },
    async consumeCheckoutRate(scope, identity, seconds) { return limiter.consume(scope, identity, seconds); },
    async getReservation(id) { return reservations.findOne({ _id: id }); },
    async available() {
      const docs = await stock.find({ _id: { $in: ['the-steel', 'the-jade'] } }).toArray();
      if (docs.length !== 2 || docs.some(doc => !Number.isSafeInteger(doc.available) || doc.available < 0)) throw new Error('STOCK_UNAVAILABLE');
      return Object.fromEntries(docs.map(doc => [doc._id, doc.available]));
    },
    async reserve(id, cart) {
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error('INVALID_RESERVATION_ID');
      try { return await transact(async session => {
        const existing = await reservations.findOne({ _id: id }, { session });
        if (existing) {
          if (existing.cartHash !== JSON.stringify(cart.items)) throw new Error('RESERVATION_CONFLICT');
          return existing;
        }
        for (const item of cart.items) {
          const updated = await stock.updateOne({ _id: item.sku, available: { $gte: item.quantity } },
            { $inc: { available: -item.quantity, reserved: item.quantity } }, { session });
          if (updated.modifiedCount !== 1) throw new Error('OUT_OF_STOCK');
        }
        const reservation = { _id: id, status: 'reserved', cartHash: JSON.stringify(cart.items),
          items: cart.items.map(({ sku, quantity, name, unitAmount }) => ({ sku, quantity, name, unitCents: unitAmount })),
          subtotalCents: cart.subtotalCents, shippingCents: cart.shippingCents, totalCents: cart.totalCents,
          currency: 'eur', createdAt: new Date(), stripeSessionId: null };
        await reservations.insertOne(reservation, { session });
        return reservation;
      }); } catch (error) {
        if (error?.code !== 11000) throw error;
        const existing = await reservations.findOne({ _id: id });
        if (!existing || existing.cartHash !== JSON.stringify(cart.items)) throw new Error('RESERVATION_CONFLICT');
        return existing;
      }
    },
    async attachSession(id, stripeSessionId) {
      const result = await reservations.updateOne({ _id: id, status: 'reserved', stripeSessionId: null },
        { $set: { stripeSessionId } });
      if (result.modifiedCount !== 1) {
        const current = await reservations.findOne({ _id: id });
        if (current?.stripeSessionId !== stripeSessionId) throw new Error('SESSION_CONFLICT');
      }
    },
    async markPaid(id, stripeSessionId, customerEmail) {
      return transact(async session => {
        const reservation = await reservations.findOne({ _id: id }, { session });
        if (!reservation || reservation.stripeSessionId !== stripeSessionId) throw new Error('RESERVATION_NOT_FOUND');
        if (reservation.status === 'paid') return false;
        if (reservation.status === 'released' || reservation.status === 'payment_review') {
          // Record the contradiction durably and idempotently; never allocate stock or fulfill.
          await paymentConflicts.updateOne({ _id:stripeSessionId }, { $setOnInsert:{ reservationId:id, status:'manual_review', reason:'paid_after_release', amountCents:reservation.totalCents, currency:reservation.currency, createdAt:new Date() } }, { upsert:true, session });
          if (reservation.status === 'released') await reservations.updateOne({ _id:id, status:'released' }, { $set:{ status:'payment_review' } }, { session });
          return 'manual_review';
        }
        if (reservation.status !== 'reserved') throw new Error('RESERVATION_STATE_CONFLICT');
        for (const item of reservation.items) {
          const updated = await stock.updateOne({ _id: item.sku, reserved: { $gte: item.quantity } },
            { $inc: { reserved: -item.quantity, sold: item.quantity } }, { session });
          if (updated.modifiedCount !== 1) throw new Error('STOCK_INVARIANT_FAILED');
        }
        const validEmail = typeof customerEmail === 'string' && customerEmail.length <= 254 && /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/.test(customerEmail);
        const completeSnapshot = Array.isArray(reservation.items) && reservation.items.every(item => typeof item.name === 'string' && Number.isSafeInteger(item.unitCents)) && Number.isSafeInteger(reservation.shippingCents);
        await orders.insertOne({ _id: stripeSessionId, reservationId: id, items: reservation.items, totalCents: reservation.totalCents, currency: reservation.currency, status: 'paid', paidAt: new Date() }, { session });
        await mailOutbox.insertOne({ _id: stripeSessionId, type: 'order_confirmation', status: validEmail && completeSnapshot ? 'pending' : 'blocked',
          recipient: validEmail ? customerEmail : null, order: { reference: stripeSessionId, items: reservation.items, shippingCents: reservation.shippingCents, totalCents: reservation.totalCents, paymentStatus: 'paid' },
          attempts: 0, nextAttemptAt: new Date(), createdAt: new Date(), claimId: null, leaseUntil: null }, { session });
        await reservations.updateOne({ _id: id, status: 'reserved' }, { $set: { status: 'paid' } }, { session });
        return true;
      });
    },
    async claimMail(claimId, now, leaseUntil) {
      return mailOutbox.findOneAndUpdate({ status: 'pending', nextAttemptAt: { $lte: now } },
        { $set: { status: 'sending', claimId, leaseUntil }, $inc: { attempts: 1 } }, { sort: { createdAt: 1 }, returnDocument: 'after' });
    },
    async settleMail(id, claimId, status, now, nextAttemptAt) {
      if (!['sent', 'pending', 'unknown', 'blocked'].includes(status)) throw new Error('INVALID_MAIL_STATE');
      const result = await mailOutbox.updateOne({ _id: id, status: 'sending', claimId },
        { $set: { status, updatedAt: now, nextAttemptAt: nextAttemptAt || now, claimId: null, leaseUntil: null } });
      return result.modifiedCount === 1;
    },
    async markExpiredMailClaimsUnknown(now) {
      const result = await mailOutbox.updateMany({ status: 'sending', leaseUntil: { $lte: now } },
        { $set: { status: 'unknown', updatedAt: now, claimId: null, leaseUntil: null } });
      return result.modifiedCount;
    },
    async releaseAfterVerifiedExpiry(id, stripeSessionId) {
      return transact(async session => {
        const reservation = await reservations.findOne({ _id: id }, { session });
        if (!reservation || reservation.stripeSessionId !== stripeSessionId) throw new Error('RESERVATION_NOT_FOUND');
        if (reservation.status === 'released') return false;
        if (reservation.status !== 'reserved') throw new Error('RESERVATION_STATE_CONFLICT');
        for (const item of reservation.items) {
          const updated = await stock.updateOne({ _id: item.sku, reserved: { $gte: item.quantity } },
            { $inc: { reserved: -item.quantity, available: item.quantity } }, { session });
          if (updated.modifiedCount !== 1) throw new Error('STOCK_INVARIANT_FAILED');
        }
        await reservations.updateOne({ _id: id, status: 'reserved' }, { $set: { status: 'released', releasedAt: new Date() } }, { session });
        return true;
      });
    },
  };
}
