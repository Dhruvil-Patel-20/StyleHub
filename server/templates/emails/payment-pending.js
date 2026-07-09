const { buildEmailLayout } = require('./layout');
const { escapeHtml, formatCurrency, buildAppUrl, getDisplayName } = require('../../utils/email.utils');

function buildPaymentPendingEmail({ name, email, order, orderUrl }) {
  const displayName = getDisplayName(name, email);
  const itemsHtml = (order.items || [])
    .map(i => `<li style="margin-bottom:6px;">${escapeHtml(i.name || i.title)} — ${formatCurrency(i.price, order.currency || 'INR')} x ${escapeHtml(String(i.qty || i.quantity || 1))}</li>`)
    .join('');

  const content = `
    <p style="font-size:16px;margin:0 0 12px;">Hi ${escapeHtml(displayName)},</p>
    <p style="margin:0 0 12px;">We noticed your order <strong>#${escapeHtml(String(order.id))}</strong> is still pending payment. To complete your purchase, please finish the payment using the link below.</p>
    <ul style="margin:12px 0;padding-left:18px;">${itemsHtml}</ul>
    <p style="margin:12px 0;font-weight:600;">Total: ${formatCurrency(order.total_price || order.totalPrice || 0, order.currency || 'INR')}</p>
    <p style="margin:16px 0;"><a href="${escapeHtml(orderUrl || buildAppUrl(`/orders/${order.id}`))}" style="background:#7c3aed;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;">Complete payment</a></p>
    <p style="margin:12px 0;color:#6b7280;font-size:13px;">If you have already completed payment, please ignore this message.</p>
  `;

  return buildEmailLayout({ title: 'Payment pending - StyleHub', previewText: 'Complete payment to confirm your order', content });
}

module.exports = { buildPaymentPendingEmail };
