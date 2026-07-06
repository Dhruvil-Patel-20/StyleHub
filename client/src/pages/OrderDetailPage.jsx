import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

const statusColor = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then(res => setOrder(res.data));
  }, [id]);

  if (!order) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const addr = order.shipping_address || {};

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Details</h1>
      <p className="text-gray-500 mb-6">#{order.id.slice(-8).toUpperCase()}</p>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex justify-between mb-4">
          <span className="font-semibold">Status</span>
          <span className={`text-sm px-3 py-1 rounded-full capitalize ${statusColor[order.status]}`}>{order.status}</span>
        </div>
        <div className="flex justify-between mb-2 text-sm">
          <span>Payment</span>
          <span className={order.is_paid ? 'text-green-600' : 'text-red-500'}>{order.is_paid ? 'Paid' : 'Unpaid'}</span>
        </div>
        <div className="flex justify-between mb-2 text-sm">
          <span>Payment Method</span>
          <span className="capitalize text-gray-700">
            {order.payment_method === 'stripe' ? '💳 Credit / Debit Card'
              : order.payment_method === 'paypal' ? '🅿️ PayPal'
              : order.payment_method === 'cod' ? '💵 Cash on Delivery'
              : order.payment_method}
          </span>
        </div>
        <div className="flex justify-between mb-2 text-sm">
          <span>Delivery Method</span>
          <span className="capitalize text-gray-700">
            {order.delivery_method === 'standard' ? '📦 Standard (5–7 days)'
              : order.delivery_method === 'express' ? '🚀 Express (2–3 days)'
              : order.delivery_method === 'nextday' ? '⚡ Next-Day'
              : order.delivery_method || 'Standard'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Date</span>
          <span>{new Date(order.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="font-semibold mb-3">Shipping Address</h2>
        <p className="text-sm text-gray-600">{addr.fullName}</p>
        <p className="text-sm text-gray-600">{addr.address}, {addr.city}</p>
        <p className="text-sm text-gray-600">{addr.postalCode}, {addr.country}</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold mb-4">Items</h2>
        {order.items?.map((item, i) => {
          const orderDate = new Date(order.created_at);
          const windowDays = item.return_window_days ?? 7;
          const returnDeadline = new Date(orderDate);
          returnDeadline.setDate(returnDeadline.getDate() + windowDays);
          const today = new Date();
          const canReturn = item.is_returnable === true && order.status === 'delivered' && today <= returnDeadline;
          const returnExpired = item.is_returnable === true && order.status === 'delivered' && today > returnDeadline;
          return (
            <div key={i} className="flex gap-4 mb-4 pb-4 border-b last:border-0 last:mb-0 last:pb-0">
              <img src={item.image || 'https://via.placeholder.com/80'} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                {item.is_returnable !== true ? (
                  <span className="inline-block mt-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">🚫 Non-Returnable</span>
                ) : canReturn ? (
                  <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">↩ Return eligible until {returnDeadline.toLocaleDateString()}</span>
                ) : returnExpired ? (
                  <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Return window expired</span>
                ) : (
                  <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">↩ {windowDays}-day return after delivery</span>
                )}
              </div>
              <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          );
        })}
        <div className="border-t pt-4 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${Number(order.total_price).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
