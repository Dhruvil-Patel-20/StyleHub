const { buildEmailLayout } = require('./layout');
const { getDisplayName, formatCurrency, escapeHtml, buildAppUrl } = require('../../utils/email.utils');

function buildPaymentReceiptEmail({ name, email, order, orderUrl }) {
  const displayName = getDisplayName(name, email);
  const shortId = String(order?.id || '').slice(-8).toUpperCase();
  const url = orderUrl || buildAppUrl(`/orders/${order?.id}`);

  const paymentMethodLabel =
    order?.payment_method === 'stripe' ? 'Credit / Debit Card' :
    order?.payment_method === 'paypal' ? 'PayPal' :
    order?.payment_method === 'cod' ? 'Cash on Delivery' :
    order?.payment_method || '—';

  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Payment received ✓</h2>
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${escapeHtml(displayName)}, we have received your payment for order <strong>#${shortId}</strong>.</p>
    <p style="margin:0 0 8px;font-size:16px;">Amount paid: <strong>${formatCurrency(order?.total_price || 0)}</strong></p>
    <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">Payment method: ${escapeHtml(paymentMethodLabel)}</p>
    <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 20px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">View order</a>
  `;

  return buildEmailLayout({
    title: 'Payment receipt',
    previewText: `Payment of ${formatCurrency(order?.total_price || 0)} received for order #${shortId}.`,
    content,
  });
}

module.exports = { buildPaymentReceiptEmail };
