const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendRefundProcessedEmail,
  sendContactEmail,
} = require('../controllers/email.controller');

router.post('/welcome', protect, sendWelcomeEmail);
router.post('/verify-email', protect, sendVerificationEmail);
router.post('/reset-password', sendResetPasswordEmail);
router.post('/order-confirmation', protect, sendOrderConfirmationEmail);
router.post('/order-shipped', protect, sendOrderShippedEmail);
router.post('/order-delivered', protect, sendOrderDeliveredEmail);
router.post('/refund-processed', protect, sendRefundProcessedEmail);
router.post('/contact', sendContactEmail);

module.exports = router;
