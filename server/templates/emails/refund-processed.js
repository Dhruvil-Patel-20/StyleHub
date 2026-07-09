const { buildEmailLayout } = require('./layout');
const { getDisplayName, formatCurrency, escapeHtml, buildAppUrl } = require('../../utils/email.utils');

function buildRefundProcessedEmail({ name, email, refundAmount, orderId, order }) {
  const displayName = getDisplayName(name, email);
  const shortId = String(orderId || order?.id || '').slice(-8).toUpperCase();
  const orderUrl = buildAppUrl(`/orders/${orderId || order?.id}`);

  const refundedItems = (order?.items || []).filter(i => i.return_status === 'refunded' || i.refund_processed === true);
  const itemList = refundedItems.map(i =>
    `<li style="margin-bottom:4px;">${escapeHtml(i.name || 'Product')}${i.size ? ` (${escapeHtml(i.size)})` : ''} x${i.quantity || 1} — ${formatCurrency(i.refund_amount ?? (i.price * (i.quantity || 1)))}</li>`
  ).join('');

  const totalRefund = refundAmount || refundedItems.reduce((s, i) => s + Number(i.refund_amount ?? (i.price * (i.quantity || 1))), 0);

  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Refund processed ✓</h2>
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${escapeHtml(displayName)}, your refund for order <strong>#${shortId}</strong> has been processed.</p>
    ${itemList ? `<ul style="margin:12px 0;padding-left:18px;font-size:15px;color:#374151;">${itemList}</ul>` : ''}
    <p style="margin:8px 0 20px;font-size:16px;">Refund amount: <strong style="color:#059669;">${formatCurrency(totalRefund)}</strong></p>
    <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">It may take 3–5 business days to appear in your account depending on your payment provider.</p>
    <a href="${escapeHtml(orderUrl)}" style="display:inline-block;padding:12px 20px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">View order</a>
  `;

  return buildEmailLayout({
    title: 'Refund processed',
    previewText: `Your refund of ${formatCurrency(totalRefund)} has been issued.`,
    content,
  });
}

module.exports = { buildRefundProcessedEmail };
