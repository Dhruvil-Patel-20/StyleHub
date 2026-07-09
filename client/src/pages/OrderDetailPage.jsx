import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

const statusColor = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-red-100 text-red-800',
};

const getDisplayStatus = (order) => order.return_status === 'refunded' ? 'returned' : order.status;

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get(`/orders/${id}`).then(res => {
      setOrder(res.data);
    }).catch(err => console.warn('[OrderDetailPage] fetch order failed', err));
  }, [id]);

  // debug: expose user context
  // console.debug('[OrderDetailPage] current user', user);

  if (!order) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const addr = order.shipping_address || {};
  const isOwner = user && (user.id === order.user_id || String(user.id) === String(order.user_id));

  const handleReturnRequest = async (index) => {
    const reason = prompt('Reason for return (optional):') ?? '';
    if (reason === null) return;
    if (!confirm('Submit return request for this item?')) return;
    try {
      const res = await api.post(`/orders/${order.id}/return`, { itemIndexes: [index], reason: reason.trim() || 'Customer requested a return' });
      setOrder(res.data);
      alert('Return request submitted. You will be notified once reviewed.');
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to request return');
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      const res = await api.post(`/orders/${order.id}/invoice`);
      setOrder(res.data);
      alert('Invoice generated');
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to generate invoice');
    }
  };

  const handleDownloadInvoice = () => {
    if (!order.invoice_url) return alert('No invoice available');
    window.open(order.invoice_url, '_blank');
  };

  const handlePrintInvoice = () => {
    if (!order.invoice_url) return alert('No invoice available');
    const w = window.open(order.invoice_url, '_blank');
    if (w) w.print();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Details</h1>
      <p className="text-gray-500 mb-6">#{order.id.slice(-8).toUpperCase()}</p>

      {/* Cancel button */}
      {(() => {
        const cancellable = isOwner && !['shipped', 'delivered', 'cancelled'].includes(order.status);
        if (!cancellable) return null;
        return (
          <div className="mb-4">
            <button
              onClick={async () => {
                if (!confirm('Are you sure you want to cancel this order?')) return;
                try {
                  const res = await api.put(`/orders/${order.id}/cancel`);
                  setOrder(res.data);
                  alert('Order cancelled');
                } catch (err) {
                  alert(err?.response?.data?.message || err.message || 'Failed to cancel order');
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Cancel Order
            </button>
          </div>
        );
      })()}

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex justify-between mb-4">
          <span className="font-semibold">Status</span>
          <span className={`text-sm px-3 py-1 rounded-full capitalize ${statusColor[getDisplayStatus(order)]}`}>{getDisplayStatus(order)}</span>
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

      <div className="mb-4 flex gap-2">
        {isOwner && !order.invoice_url && (
          <button onClick={handleGenerateInvoice} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Generate Invoice</button>
        )}
        {order.invoice_url && (
          <>
            <button onClick={handleDownloadInvoice} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Download PDF</button>
            <button onClick={handlePrintInvoice} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">Print</button>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold mb-4">Items</h2>
        {order.items?.map((item, i) => {
          const orderDate = new Date(order.delivered_at || (order.status === 'delivered' ? new Date() : order.created_at));
          const windowDays = item.return_window_days ?? 7;
          const returnDeadline = new Date(orderDate);
          returnDeadline.setDate(returnDeadline.getDate() + windowDays);
          const today = new Date();
          const isExplicitlyNonReturnable = item.is_returnable === false && item.return_window_days !== null;
          const canReturn = !isExplicitlyNonReturnable && order.status === 'delivered' && today <= returnDeadline;
          const returnExpired = !isExplicitlyNonReturnable && order.status === 'delivered' && today > returnDeadline;
          const returnState = item.return_status || (item.return_requested ? 'requested' : null);
          const returnLabel = returnState === 'requested'
            ? 'Return requested'
            : returnState === 'approved'
              ? 'Return approved'
              : returnState === 'rejected'
                ? 'Return rejected'
                : returnState === 'refunded'
                  ? 'Refund processed'
                  : null;
          const refunded = item.return_status === 'refunded' || item.refund_processed === true;
          const returnRequested = Boolean(returnState);

          return (
            <div key={i} className="flex gap-4 mb-4 pb-4 border-b last:border-0 last:mb-0 last:pb-0">
              <img src={item.image || 'https://via.placeholder.com/80'} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                {isExplicitlyNonReturnable ? (
                  <span className="inline-block mt-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">🚫 Non-Returnable</span>
                ) : order.status !== 'delivered' ? (
                  <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">↩ Available for return after delivery</span>
                ) : returnRequested || refunded ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {returnLabel && (
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${refunded ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{returnLabel}</span>
                    )}
                    {returnLabel && (
                      <p className="mt-1 text-xs text-gray-500 w-full">{item.return_reason || item.return_admin_note || ''}</p>
                    )}
                  </div>
                ) : canReturn ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Return eligible until {returnDeadline.toLocaleDateString()}</span>
                    {isOwner && (
                      <button onClick={() => handleReturnRequest(i)} className="text-xs bg-yellow-600 text-white px-3 py-1 rounded-full hover:bg-yellow-700 font-medium">
                        → Request Return
                      </button>
                    )}
                    {!isOwner && (
                      <span className="text-xs text-gray-500 italic">(Must be order owner to request)</span>
                    )}
                  </div>
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
