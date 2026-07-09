const { buildEmailLayout } = require('./layout');
const { getDisplayName, formatCurrency } = require('../../utils/email.utils');

function buildOrderShippedEmail({ name, email, order, trackingUrl }) {
  const displayName = getDisplayName(name, email);
  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Your order is on the way</h2>
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${displayName}, order #${order?.id || 'N/A'} has been shipped and is on its way to you.</p>
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Total paid: <strong>${formatCurrency(order?.total_price || 0)}</strong></p>
    <a href="${trackingUrl}" style="display:inline-block;padding:12px 20px;background-color:#059669;color:#ffffff;text-decoration:none;border-radius:8px;">Track shipment</a>
  `;

  return buildEmailLayout({
    title: 'Order shipped',
    previewText: 'Your StyleHub order has shipped.',
    content,
  });
}

module.exports = { buildOrderShippedEmail };
