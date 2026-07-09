const { buildEmailLayout } = require('./layout');
const { getDisplayName } = require('../../utils/email.utils');

function buildWelcomeEmail({ name, email, role = 'client', roleLabel = 'customer', rolePortal = '/' } = {}) {
  const displayName = getDisplayName(name, email);
  const roleText = role === 'admin'
    ? 'manage orders, users, and storefront settings.'
    : role === 'seller'
      ? 'list products, manage inventory, and track your sales.'
      : 'browse fashion picks, save favorites, and track your orders.';
  const actionText = role === 'admin' ? 'Open admin dashboard' : role === 'seller' ? 'Open seller dashboard' : 'Start shopping';
  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Welcome aboard, ${displayName}!</h2>
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Your StyleHub ${roleLabel} account is ready. ${roleText}</p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">If you ever need help, our support team is just a message away.</p>
    <a href="${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000'}${rolePortal}" style="display:inline-block;padding:12px 20px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">${actionText}</a>
  `;

  return buildEmailLayout({
    title: 'Welcome to StyleHub',
    previewText: 'Your StyleHub account is now active.',
    content,
  });
}

module.exports = { buildWelcomeEmail };
