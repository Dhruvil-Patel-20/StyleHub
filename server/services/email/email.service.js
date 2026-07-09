const config = require('../../config/email.config');
const { sendWithBrevo } = require('./transporter');

async function sendMail({ to, subject, html, text, from, replyTo, cc, bcc }) {
  if (!config.brevo.enabled) {
    console.warn('Brevo email skipped because BREVO_API_KEY is not configured.');
    return { skipped: true, reason: 'BREVO_API_KEY missing' };
  }

  const payload = {
    sender: { name: 'StyleHub', email: from || config.defaults.from },
    to: Array.isArray(to) ? to.map((address) => ({ email: address })) : [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  };

  if (replyTo || config.defaults.replyTo) {
    payload.replyTo = { email: replyTo || config.defaults.replyTo };
  }
  if (cc) payload.cc = Array.isArray(cc) ? cc.map((address) => ({ email: address })) : [{ email: cc }];
  if (bcc) payload.bcc = Array.isArray(bcc) ? bcc.map((address) => ({ email: address })) : [{ email: bcc }];

  await sendWithBrevo(payload);
  return { skipped: false };
}

module.exports = { sendMail };
