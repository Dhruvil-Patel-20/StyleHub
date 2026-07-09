const { buildEmailLayout } = require('./layout');
const { getDisplayName, formatCurrency, escapeHtml } = require('../../utils/email.utils');

function buildOrderCancelledEmail({ name, email, order }) {
  const displayName = getDisplayName(name, email);
  const shortId = String(order?.id || '').slice(-8).toUpperCase();
  const items = Array.isArray(order?.items) ? order.items : [];

  const itemList = items.map(i =>
    `<li style="margin-bottom:4px;">${escapeHtml(i.name || 'Product')}${i.size ? ` (${escapeHtml(i.size)})` : ''} x${i.quantity || 1} — ${formatCurrency(i.price || 0)}</li>`
  ).join('');

  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Order cancelled</h2>
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${escapeHtml(displayName)}, order <strong>#${shortId}</strong> has been cancelled.</p>
    ${itemList ? `<ul style="margin:12px 0;padding-left:18px;font-size:15px;color:#374151;">${itemList}</ul>` : ''}
    <p style="margin:8px 0 12px;font-size:16px;">Total: <strong>${formatCurrency(order?.total_price || 0)}</strong></p>
    <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">If this was a mistake or you need help, please contact our support team.</p>
  `;

  return buildEmailLayout({
    title: 'Order cancelled',
    previewText: `Your StyleHub order #${shortId} was cancelled.`,
    content,
  });
}

module.exports = { buildOrderCancelledEmail };
