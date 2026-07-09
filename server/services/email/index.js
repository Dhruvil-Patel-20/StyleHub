const { sendMail } = require('./email.service');

function getRoleLabel(role = 'client') {
  if (role === 'admin') return 'admin';
  if (role === 'seller') return 'seller';
  return 'customer';
}

function getRolePortal(role = 'client') {
  if (role === 'admin') return '/admin';
  if (role === 'seller') return '/seller';
  return '/';
}

const templates = {
  welcome: require('../../templates/emails/welcome'),
  verifyEmail: require('../../templates/emails/verify-email'),
  resetPassword: require('../../templates/emails/reset-password'),
  orderConfirmation: require('../../templates/emails/order-confirmation'),
  paymentReceipt: require('../../templates/emails/payment-receipt'),
  orderShipped: require('../../templates/emails/order-shipped'),
  orderDelivered: require('../../templates/emails/order-delivered'),
  orderCancelled: require('../../templates/emails/order-cancelled'),
  paymentPending: require('../../templates/emails/payment-pending'),
  refundProcessed: require('../../templates/emails/refund-processed'),
};

async function sendEmailTemplate({ type, to, data = {} }) {
  const templateMap = {
    welcome: templates.welcome.buildWelcomeEmail,
    verifyEmail: templates.verifyEmail.buildVerifyEmail,
    resetPassword: templates.resetPassword.buildResetPasswordEmail,
    orderConfirmation: templates.orderConfirmation.buildOrderConfirmationEmail,
    paymentReceipt: templates.paymentReceipt.buildPaymentReceiptEmail,
    paymentPending: templates.paymentPending.buildPaymentPendingEmail,
    orderShipped: templates.orderShipped.buildOrderShippedEmail,
    orderDelivered: templates.orderDelivered.buildOrderDeliveredEmail,
    orderCancelled: templates.orderCancelled.buildOrderCancelledEmail,
    refundProcessed: templates.refundProcessed.buildRefundProcessedEmail,
  };

  const builder = templateMap[type];
  if (!builder) {
    throw new Error(`Unsupported email template: ${type}`);
  }

  const role = data.role || 'client';
  const roleLabel = getRoleLabel(role);
  const rolePortal = getRolePortal(role);
  const html = builder({ ...data, role, roleLabel, rolePortal });
  const subject = {
    welcome: `Welcome to StyleHub${roleLabel === 'customer' ? '' : ` (${roleLabel})`}`,
    verifyEmail: `Verify your ${roleLabel} StyleHub account`,
    resetPassword: 'Reset your StyleHub password',
    orderConfirmation: 'Order confirmation - StyleHub',
    paymentReceipt: 'Payment receipt - StyleHub',
    paymentPending: 'Payment pending - StyleHub',
    orderShipped: 'Your StyleHub order has shipped',
    orderDelivered: 'Your StyleHub order has been delivered',
    orderCancelled: 'Your StyleHub order was cancelled',
    refundProcessed: 'Refund processed - StyleHub',
  }[type];

  try {
    console.log(`Sending email template '${type}' to ${to}`);
    const result = await sendMail({ to, subject, html });
    console.log(`Email template '${type}' send result:`, result);
    return result;
  } catch (error) {
    console.warn('Email delivery failed:', error.message, error.stack || '');
    return { skipped: true, reason: error.message };
  }
}

module.exports = { sendEmailTemplate, sendMail };
