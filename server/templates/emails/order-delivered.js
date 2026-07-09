const { buildEmailLayout } = require('./layout');
const { getDisplayName, formatCurrency, escapeHtml, buildAppUrl } = require('../../utils/email.utils');

function buildOrderDeliveredEmail({ name, email, order }) {
  const displayName = getDisplayName(name, email);
  const shortId = String(order?.id || '').slice(-8).toUpperCase();
  const orderUrl = buildAppUrl(`/orders/${order?.id}`);

  const returnableItems = (order?.items || []).filter(i => i.is_returnable !== false);
  const returnWindow = returnableItems.length > 0
    ? `<p style="margin:12px 0;font-size:14px;color:#6b7280;">↩ Items eligible for return within their return window. <a href="${escapeHtml(orderUrl)}" style="color:#2563eb;">View return options</a></p>`
    : '';

  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Your order has arrived 📦</h2>
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${escapeHtml(displayName)}, order <strong>#${shortId}</strong> has been delivered.</p>
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Total: <strong>${formatCurrency(order?.total_price || 0)}</strong></p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">We hope you love your purchase. If anything feels off, you can request a return directly from your order page.</p>
    ${returnWindow}
    <a href="${escapeHtml(orderUrl)}" style="display:inline-block;padding:12px 20px;background-color:#059669;color:#ffffff;text-decoration:none;border-radius:8px;">View order</a>
  `;

  return buildEmailLayout({
    title: 'Order delivered',
    previewText: `Your StyleHub order #${shortId} has arrived.`,
    content,
  });
}

module.exports = { buildOrderDeliveredEmail };
