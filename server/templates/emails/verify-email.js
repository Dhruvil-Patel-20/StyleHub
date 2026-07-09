const { buildEmailLayout } = require('./layout');
const { getDisplayName } = require('../../utils/email.utils');

function buildVerifyEmail({ name, email, verificationUrl, role = 'client', roleLabel = 'customer' } = {}) {
  const displayName = getDisplayName(name, email);
  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Verify your email</h2>
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${displayName}, please verify your email address to secure your StyleHub ${roleLabel} account.</p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">Click the button below to confirm your email.</p>
    <a href="${verificationUrl}" style="display:inline-block;padding:12px 20px;background-color:#7c3aed;color:#ffffff;text-decoration:none;border-radius:8px;">Verify email</a>
  `;

  return buildEmailLayout({
    title: 'Verify your email',
    previewText: 'Complete your email verification.',
    content,
  });
}

module.exports = { buildVerifyEmail };
