// Content only: delivery and reliable job handling require a configured mail service.
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const money = cents => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

export function renderOrderConfirmation(order) {
  if (!order || !/^[A-Za-z0-9_-]{1,100}$/.test(order.reference || '') ||
      !Array.isArray(order.items) || !order.items.length || order.items.length > 100 ||
      !Number.isSafeInteger(order.shippingCents) || order.shippingCents < 0 ||
      !['paid', 'pending'].includes(order.paymentStatus)) throw new Error('INVALID_ORDER');
  let subtotal = 0;
  for (const item of order.items) {
    if (typeof item.name !== 'string' || !item.name.trim() || item.name.length > 200 ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100 ||
        !Number.isSafeInteger(item.unitCents) || item.unitCents < 0) throw new Error('INVALID_ORDER');
    subtotal += item.unitCents * item.quantity;
  }
  if (!Number.isSafeInteger(subtotal) || !Number.isSafeInteger(subtotal + order.shippingCents) ||
      order.totalCents !== subtotal + order.shippingCents) throw new Error('INVALID_ORDER_TOTAL');
  const payment = order.paymentStatus === 'paid' ? 'Zahlung bestätigt' : 'Zahlung steht noch aus';
  const lines = order.items.map(item => `${item.quantity} × ${item.name} — ${money(item.unitCents)} pro Stück`);
  const totals = [`Zwischensumme: ${money(subtotal)}`, `Versand: ${money(order.shippingCents)}`, `Gesamt: ${money(order.totalCents)}`, payment];
  const subject = `${payment} · GUA SHOP · ${order.reference}`;
  const text = [`Hallo,`, '', payment + '.', 'Diese Nachricht informiert über den Zahlungsstatus; sie ist keine gesonderte Vertragsannahme.', '', `Referenz: ${order.reference}`, ...lines, '', ...totals, '', 'Bei Fragen antworte bitte auf diese E-Mail.', '', 'GUA SHOP'].join('\n');
  const html = `<p>Hallo,</p><p>${escapeHtml(payment)}.</p><p>Diese Nachricht informiert über den Zahlungsstatus; sie ist keine gesonderte Vertragsannahme.</p><p>Referenz: ${escapeHtml(order.reference)}</p><ul>${lines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>${totals.map(line => `<p>${escapeHtml(line)}</p>`).join('')}<p>Bei Fragen antworte bitte auf diese E-Mail.</p><p>GUA SHOP</p>`;
  return { subject, text, html };
}

// Templates only. No sender or trigger is attached to the current mailto inquiry.
export function renderInquiryReceipt(reference) {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(reference || '')) throw new Error('INVALID_REFERENCE');
  const subject = `Deine Anfrage bei GUA SHOP · ${reference}`;
  const text = ['Hallo,', '', 'wir haben deine Anfrage erhalten. Sie ist noch keine verbindliche Bestellung und kein Kaufvertrag.', 'Wir prüfen deine Anfrage und melden uns mit weiteren Informationen.', '', `Referenz: ${reference}`, '', 'GUA SHOP'].join('\n');
  const html = `<p>Hallo,</p><p>Wir haben deine Anfrage erhalten. Sie ist noch keine verbindliche Bestellung und kein Kaufvertrag.</p><p>Wir prüfen deine Anfrage und melden uns mit weiteren Informationen.</p><p>Referenz: ${escapeHtml(reference)}</p><p>GUA SHOP</p>`;
  return { subject, text, html };
}

export function renderOrderReceipt(reference) {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(reference || '')) throw new Error('INVALID_REFERENCE');
  const subject = `Eingang deiner Bestellung · GUA SHOP · ${reference}`;
  const text = ['Hallo,', '', 'wir haben deine Bestellung erhalten. Diese Eingangsbestätigung ist keine gesonderte Vertragsannahme und keine Zahlungsbestätigung.', '', `Referenz: ${reference}`, '', 'GUA SHOP'].join('\n');
  const html = `<p>Hallo,</p><p>Wir haben deine Bestellung erhalten. Diese Eingangsbestätigung ist keine gesonderte Vertragsannahme und keine Zahlungsbestätigung.</p><p>Referenz: ${escapeHtml(reference)}</p><p>GUA SHOP</p>`;
  return { subject, text, html };
}

// Call only after an actual contract exists and with its complete immutable terms and required information.
export function renderContractConfirmation({ reference, contractSnapshot } = {}) {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(reference || '') || typeof contractSnapshot !== 'string' || !contractSnapshot.trim() || contractSnapshot.length > 100000) throw new Error('INVALID_CONTRACT');
  const subject = `Vertragsbestätigung · GUA SHOP · ${reference}`;
  const text = ['Hallo,', '', 'wir bestätigen den geschlossenen Vertrag:', '', contractSnapshot, '', `Referenz: ${reference}`, '', 'GUA SHOP'].join('\n');
  const html = `<p>Hallo,</p><p>Wir bestätigen den geschlossenen Vertrag:</p><div style="white-space:pre-wrap">${escapeHtml(contractSnapshot)}</div><p>Referenz: ${escapeHtml(reference)}</p><p>GUA SHOP</p>`;
  return { subject, text, html };
}
