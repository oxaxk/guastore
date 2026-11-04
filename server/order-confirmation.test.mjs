import test from 'node:test';
import assert from 'node:assert/strict';
import { renderOrderConfirmation, renderInquiryReceipt, renderOrderReceipt, renderContractConfirmation } from './order-confirmation.mjs';

const order = { reference: 'test-123', items: [{ name: 'Xiu Jade <test>', quantity: 2, unitCents: 990 }], shippingCents: 0, totalCents: 1980, paymentStatus: 'pending' };
test('confirmation escapes product content and accurately distinguishes pending payment', () => {
  const message = renderOrderConfirmation(order);
  assert.match(message.html, /&lt;test&gt;/);
  assert.doesNotMatch(message.html, /<test>/);
  assert.match(message.text, /Zahlung steht noch aus/);
  assert.doesNotMatch(message.text, /Zahlung bestätigt/);
  assert.match(message.text, /19,80/);
});
test('inquiry and order receipt distinguish their stages without claiming payment or acceptance', () => {
  assert.match(renderInquiryReceipt('a-1').text, /keine verbindliche Bestellung/);
  assert.match(renderOrderReceipt('a-1').text, /keine Zahlungsbestätigung/);
  assert.throws(() => renderOrderReceipt('x\r\nInjected'), /INVALID_REFERENCE/);
});
test('contract template needs explicit terms and safely displays them', () => {
  assert.throws(() => renderContractConfirmation({ reference: 'a-1' }), /INVALID_CONTRACT/);
  const result = renderContractConfirmation({ reference: 'a-1', contractSnapshot: 'Artikel: <Test>' });
  assert.match(result.html, /&lt;Test&gt;/);
  assert.match(result.text, /geschlossenen Vertrag/);
});
test('paid status has a payment-specific subject, not a claim of acceptance', () => {
  const result = renderOrderConfirmation({ ...order, paymentStatus: 'paid' });
  assert.match(result.subject, /Zahlung bestätigt/);
  assert.match(result.text, /keine gesonderte Vertragsannahme/);
});
test('confirmation rejects mismatched totals and unsafe subject references', () => {
  assert.throws(() => renderOrderConfirmation({ ...order, totalCents: 1 }), /INVALID_ORDER_TOTAL/);
  assert.throws(() => renderOrderConfirmation({ ...order, reference: 'test\r\nInjected' }), /INVALID_ORDER/);
});
