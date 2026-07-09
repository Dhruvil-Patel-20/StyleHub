require('dotenv').config();

module.exports = {
  brevo: {
    apiKey: process.env.BREVO_API_KEY || '',
    enabled: Boolean(process.env.BREVO_API_KEY),
  },
  defaults: {
    from: process.env.EMAIL_FROM || 'no-reply@stylehub.com',
    replyTo: process.env.REPLY_TO_EMAIL || process.env.EMAIL_FROM || 'no-reply@stylehub.com',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@stylehub.com',
    appUrl: process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000',
  },
};
