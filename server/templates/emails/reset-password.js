const { buildEmailLayout } = require('./layout');
const { getDisplayName } = require('../../utils/email.utils');

function buildResetPasswordEmail({ name, email, resetUrl, role = 'client', roleLabel = 'customer' } = {}) {
  const displayName = getDisplayName(name, email);
  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Reset your password</h2>
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${displayName}, we received a request to reset the password for your StyleHub ${roleLabel} account.</p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">Use the button below to choose a new password. If you didn't request this, you can safely ignore this email.</p>
    <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background-color:#dc2626;color:#ffffff;text-decoration:none;border-radius:8px;">Reset password</a>
  `;

  return buildEmailLayout({
    title: 'Reset your password',
    previewText: 'Secure your StyleHub account.',
    content,
  });
}

module.exports = { buildResetPasswordEmail };
