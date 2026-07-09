const test = require('node:test');
const assert = require('node:assert/strict');
const { applyReturnRequest, applyRefundProcessing } = require('../utils/returnUtils');

test('applyReturnRequest marks eligible items as requested', () => {
  const items = [
    { name: 'Shirt', is_returnable: true, quantity: 1 },
    { name: 'Cap', is_returnable: false, quantity: 1 },
  ];

  const updated = applyReturnRequest(items, { reason: 'Size issue' });

  assert.equal(updated[0].return_requested, true);
  assert.equal(updated[0].return_status, 'requested');
  assert.equal(updated[0].return_reason, 'Size issue');
  assert.equal(updated[1].return_requested, false);
  assert.equal(updated[1].return_status, undefined);
});

test('applyRefundProcessing marks refund as processed and sends amount', () => {
  const items = [
    { name: 'Shirt', is_returnable: true, quantity: 1, price: 49.99, return_requested: true, return_status: 'requested' },
  ];

  const updated = applyRefundProcessing(items, { refundAmount: 49.99 });

  assert.equal(updated[0].return_status, 'refunded');
  assert.equal(updated[0].refund_processed, true);
  assert.equal(updated[0].refund_amount, 49.99);
});
