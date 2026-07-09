const { buildEmailLayout } = require('./layout');
const { getDisplayName, formatCurrency, escapeHtml } = require('../../utils/email.utils');

function buildOrderConfirmationEmail({ name, email, order, orderUrl }) {
  const displayName = getDisplayName(name, email);
  const items = Array.isArray(order?.items) ? order.items : [];
  const shortId = String(order?.id || '').slice(-8).toUpperCase();

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.name || 'Product')}${item.size ? ` <span style="color:#6b7280;font-size:13px;">(${escapeHtml(item.size)})</span>` : ''}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity || 1}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.price || 0)}</td>
    </tr>
  `).join('');

  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Order confirmed ✓</h2>
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${escapeHtml(displayName)}, your order <strong>#${shortId}</strong> has been placed successfully.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
      <thead>
        <tr style="text-align:left;color:#64748b;font-size:13px;">
          <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;">Item</th>
          <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;text-align:center;">Qty</th>
          <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <p style="margin:0 0 20px;font-size:16px;">Total: <strong>${formatCurrency(order?.total_price || 0)}</strong></p>
    <a href="${escapeHtml(orderUrl || '')}" style="display:inline-block;padding:12px 20px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">View order</a>
  `;

  return buildEmailLayout({
    title: 'Order confirmation',
    previewText: `Your StyleHub order #${shortId} is confirmed.`,
    content,
  });
}

module.exports = { buildOrderConfirmationEmail };
