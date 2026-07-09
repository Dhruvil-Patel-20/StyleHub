const emailService = require('../services/email');

async function sendWelcomeEmail(req, res) {
  try {
    await emailService.sendEmailTemplate({
      type: 'welcome',
      to: req.body.to || req.user?.email,
      data: { name: req.body.name || req.user?.name, email: req.body.to || req.user?.email },
    });
    res.json({ message: 'Welcome email queued' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function sendVerificationEmail(req, res) {
  try {
    await emailService.sendEmailTemplate({
      type: 'verifyEmail',
      to: req.body.to || req.user?.email,
      data: {
        name: req.body.name || req.user?.name,
        email: req.body.to || req.user?.email,
        verificationUrl: req.body.verificationUrl,
      },
    });
    res.json({ message: 'Verification email queued' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function sendResetPasswordEmail(req, res) {
  try {
    await emailService.sendEmailTemplate({
      type: 'resetPassword',
      to: req.body.to,
      data: {
        name: req.body.name,
        email: req.body.to,
        resetUrl: req.body.resetUrl,
      },
    });
    res.json({ message: 'Password reset email queued' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function sendOrderConfirmationEmail(req, res) {
  try {
    await emailService.sendEmailTemplate({
      type: 'orderConfirmation',
      to: req.body.to,
      data: {
        name: req.body.name,
        email: req.body.to,
        order: req.body.order,
        orderUrl: req.body.orderUrl,
      },
    });
    res.json({ message: 'Order confirmation email queued' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function sendOrderShippedEmail(req, res) {
  try {
    await emailService.sendEmailTemplate({
      type: 'orderShipped',
      to: req.body.to,
      data: {
        name: req.body.name,
        email: req.body.to,
        order: req.body.order,
        trackingUrl: req.body.trackingUrl,
      },
    });
    res.json({ message: 'Shipping update email queued' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function sendOrderDeliveredEmail(req, res) {
  try {
    await emailService.sendEmailTemplate({
      type: 'orderDelivered',
      to: req.body.to,
      data: {
        name: req.body.name,
        email: req.body.to,
        order: req.body.order,
      },
    });
    res.json({ message: 'Delivery confirmation email queued' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function sendRefundProcessedEmail(req, res) {
  try {
    await emailService.sendEmailTemplate({
      type: 'refundProcessed',
      to: req.body.to,
      data: {
        name: req.body.name,
        email: req.body.to,
        refundAmount: req.body.refundAmount,
        orderId: req.body.orderId,
      },
    });
    res.json({ message: 'Refund email queued' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function sendContactEmail(req, res) {
  try {
    const { name, email, message, subject } = req.body;
    await emailService.sendMail({
      to: process.env.ADMIN_EMAIL || 'admin@stylehub.com',
      subject: `New contact form message: ${subject || 'StyleHub contact'}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`,
    });
    await emailService.sendMail({
      to: email,
      subject: 'We received your message - StyleHub',
      html: `<p>Hi ${name},</p><p>Thanks for reaching out. We have received your message and will get back to you shortly.</p>`,
    });
    res.json({ message: 'Contact email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendRefundProcessedEmail,
  sendContactEmail,
};
