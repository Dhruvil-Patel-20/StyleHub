const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000', 'https://style-hub-rouge.vercel.app'],
    credentials: true,
  })
);

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/users', require('./routes/users'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/email', require('./routes/email.routes'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/coupons', require('./routes/coupons'));

// start background payment reminder
try {
  const { startPaymentReminder } = require('./services/paymentReminder');
  startPaymentReminder();
} catch (err) {
  console.warn('Payment reminder service failed to start:', err.message);
}

module.exports = app;
