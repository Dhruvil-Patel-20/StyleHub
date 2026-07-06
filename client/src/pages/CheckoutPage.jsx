import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

const DELIVERY_OPTIONS = [
  { id: 'standard', label: 'Standard Delivery', desc: '5–7 business days', price: 0, freeOver: 50 },
  { id: 'express', label: 'Express Delivery', desc: '2–3 business days', price: 9.99, freeOver: null },
  { id: 'nextday', label: 'Next-Day Delivery', desc: 'Order before 12pm', price: 19.99, freeOver: null },
];

const PAYMENT_OPTIONS = [
  { id: 'stripe', label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, Amex' },
  { id: 'razorpay', label: 'Razorpay', icon: '🇮🇳', desc: 'UPI, Cards, Netbanking & Wallets' },
  { id: 'paypal', label: 'PayPal', icon: '🅿️', desc: 'Pay via your PayPal account' },
  { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when your order arrives' },
];

export default function CheckoutPage() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState({ fullName: '', address: '', city: '', postalCode: '', country: '' });
  const [delivery, setDelivery] = useState('standard');
  const [payment, setPayment] = useState('stripe');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [loading, setLoading] = useState(false);

  const deliveryOption = DELIVERY_OPTIONS.find(d => d.id === delivery);
  const deliveryCost = deliveryOption.freeOver !== null && total >= deliveryOption.freeOver ? 0 : deliveryOption.price;
  const orderTotal = total + deliveryCost;

  const handleChange = e => setAddress({ ...address, [e.target.name]: e.target.value });
  const handleCard = e => setCardDetails({ ...cardDetails, [e.target.name]: e.target.value });

  const loadRazorpayScript = () =>
    new Promise(resolve => {
      if (document.getElementById('razorpay-script')) return resolve(true);
      const s = document.createElement('script');
      s.id = 'razorpay-script';
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const buildOrderData = () => ({
    items: cart.map(i => ({
      productId: i.id || i._id,
      name: i.name,
      image: i.images?.[0],
      price: i.price,
      quantity: i.quantity,
      size: i.size,
      color: i.color,
      is_returnable: i.is_returnable === true,
      return_window_days: i.is_returnable === true ? (i.return_window_days ?? 7) : null,
    })),
    shippingAddress: address,
    deliveryMethod: delivery,
    paymentMethod: payment,
    totalPrice: orderTotal,
  });

  const handleRazorpay = async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded) { toast.error('Failed to load Razorpay'); return; }

    // amount in INR — using orderTotal as INR for test purposes
    const { data: rzpOrder } = await api.post('/payment/razorpay/create-order', { amount: orderTotal });
    const { data: order } = await api.post('/orders', buildOrderData());

    const options = {
      key: rzpOrder.keyId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      name: 'StyleHub',
      description: 'Order Payment',
      order_id: rzpOrder.orderId,
      prefill: {
        name: address.fullName,
        email: user.email,
        contact: '9999999999',
      },
      config: {
        display: {
          blocks: {
            utib: { name: 'Pay via Card/UPI', instruments: [{ method: 'upi' }, { method: 'card' }] },
          },
          sequence: ['block.utib'],
          preferences: { show_default_blocks: true },
        },
      },
      handler: async (response) => {
        await api.put(`/orders/${order.id}/pay`, {
          id: response.razorpay_payment_id,
          status: 'succeeded',
          email: user.email,
        });
        clearCart();
        toast.success('Payment successful!');
        navigate(`/orders/${order.id}`);
      },
      modal: { ondismiss: () => { setLoading(false); toast.error('Payment cancelled'); } },
    };
    new window.Razorpay(options).open();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (payment === 'stripe') {
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
        toast.error('Please fill in all card details');
        return;
      }
    }
    setLoading(true);
    try {
      if (payment === 'razorpay') {
        await handleRazorpay();
        return;
      }
      const { data: order } = await api.post('/orders', buildOrderData());
      if (payment !== 'cod') {
        await api.put(`/orders/${order.id}/pay`, {
          id: 'sim_' + Date.now(),
          status: 'succeeded',
          email: user.email,
        });
      }
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders/${order.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      if (payment !== 'razorpay') setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Checkout</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Shipping Address */}
            <section>
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center">1</span>
                Shipping Address
              </h2>
              <div className="space-y-3">
                {[
                  { name: 'fullName', placeholder: 'Full Name' },
                  { name: 'address', placeholder: 'Street Address' },
                  { name: 'city', placeholder: 'City' },
                  { name: 'postalCode', placeholder: 'Postal Code' },
                  { name: 'country', placeholder: 'Country' },
                ].map(f => (
                  <input key={f.name} name={f.name} placeholder={f.placeholder} required
                    value={address[f.name]} onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                ))}
              </div>
            </section>

            {/* Delivery Method */}
            <section>
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center">2</span>
                Delivery Method
              </h2>
              <div className="space-y-3">
                {DELIVERY_OPTIONS.map(opt => {
                  const cost = opt.freeOver !== null && total >= opt.freeOver ? 0 : opt.price;
                  return (
                    <label key={opt.id}
                      className={`flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer transition ${delivery === opt.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="delivery" value={opt.id} checked={delivery === opt.id}
                          onChange={() => setDelivery(opt.id)} className="accent-indigo-600" />
                        <div>
                          <p className="font-medium text-sm">{opt.label}</p>
                          <p className="text-xs text-gray-500">{opt.desc}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-indigo-700">
                        {cost === 0 ? 'Free' : `$${cost.toFixed(2)}`}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Payment Method */}
            <section>
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center">3</span>
                Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_OPTIONS.map(opt => (
                  <label key={opt.id}
                    className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition ${payment === opt.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                    <input type="radio" name="payment" value={opt.id} checked={payment === opt.id}
                      onChange={() => setPayment(opt.id)} className="accent-indigo-600" />
                    <span className="text-xl">{opt.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Card details form */}
              {payment === 'stripe' && (
                <div className="mt-4 space-y-3 bg-gray-50 rounded-xl p-4 border border-indigo-100">
                  <input name="name" placeholder="Name on Card" required value={cardDetails.name} onChange={handleCard}
                    className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                  <input name="number" placeholder="Card Number (16 digits)" required maxLength={19}
                    value={cardDetails.number} onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                      const formatted = v.replace(/(.{4})/g, '$1 ').trim();
                      setCardDetails({ ...cardDetails, number: formatted });
                    }}
                    className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                  <div className="grid grid-cols-2 gap-3">
                    <input name="expiry" placeholder="MM/YY" required maxLength={5}
                      value={cardDetails.expiry} onChange={e => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
                        setCardDetails({ ...cardDetails, expiry: v });
                      }}
                      className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                    <input name="cvv" placeholder="CVV" required maxLength={4}
                      value={cardDetails.cvv} onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">🔒 Your card details are secure and encrypted</p>
                </div>
              )}

              {payment === 'razorpay' && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                  You'll be redirected to Razorpay's secure checkout to pay via UPI, Card, Netbanking, or Wallet.
                </div>
              )}

              {payment === 'paypal' && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                  You will be redirected to PayPal to complete your payment after placing the order.
                </div>
              )}

              {payment === 'cod' && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                  Pay with cash when your order is delivered. No online payment required.
                </div>
              )}
            </section>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery ({deliveryOption.label})</span>
                  <span className={deliveryCost === 0 ? 'text-green-600' : ''}>{deliveryCost === 0 ? 'Free' : `$${deliveryCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment</span>
                  <span>{PAYMENT_OPTIONS.find(p => p.id === payment)?.label}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>${orderTotal.toFixed(2)}</span>
                </div>
              </div>
              <button type="submit" disabled={loading || cart.length === 0}
                className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-full hover:bg-indigo-700 font-medium disabled:opacity-50 transition">
                {loading ? 'Placing Order...' : `Place Order · $${orderTotal.toFixed(2)}`}
              </button>
              {cart.length === 0 && <p className="text-center text-sm text-red-400 mt-2">Your cart is empty</p>}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
