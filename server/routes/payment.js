const router = require('express').Router();
const Razorpay = require('razorpay');
const Stripe = require('stripe');
const { protect } = require('../middleware/auth');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create Razorpay order
router.post('/razorpay/create-order', protect, async (req, res) => {
  try {
    const { amount } = req.body; // amount in INR
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: 'receipt_' + Date.now(),
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
