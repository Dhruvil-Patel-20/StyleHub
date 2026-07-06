import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products?limit=1'),
      api.get('/orders/all'),
    ]).then(([pRes, oRes]) => {
      setStats({ products: pRes.data.total, orders: oRes.data.length });
      setOrders(oRes.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const statusColor = {
    pending: 'text-yellow-600',
    processing: 'text-blue-600',
    shipped: 'text-purple-600',
    delivered: 'text-green-600',
    cancelled: 'text-red-600',
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Products', value: stats.products, link: '/admin/products', color: 'bg-blue-50' },
          { label: 'Total Orders', value: stats.orders, link: '/admin/orders', color: 'bg-green-50' },
        ].map(s => (
          <Link key={s.label} to={s.link} className={`${s.color} rounded-xl p-6 hover:shadow-md transition`}>
            <p className="text-3xl font-bold text-gray-800">{s.value}</p>
            <p className="text-gray-500 text-sm mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="flex gap-4 mb-8">
        <Link to="/admin/products/new" className="bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-700">+ Add Product</Link>
        <Link to="/admin/products" className="border border-indigo-600 text-indigo-600 px-5 py-2 rounded-full hover:bg-indigo-50">Manage Products</Link>
        <Link to="/admin/orders" className="border border-indigo-600 text-indigo-600 px-5 py-2 rounded-full hover:bg-indigo-50">Manage Orders</Link>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-lg mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-gray-400 text-sm">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Order ID</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Payment</th>
                <th className="pb-2">Delivery</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-2">
                    <Link to={`/orders/${o.id}`} className="text-indigo-600 hover:underline">
                      #{o.id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="py-2">{o.users?.name || 'N/A'}</td>
                  <td className="py-2">${Number(o.total_price).toFixed(2)}</td>
                  <td className="py-2 text-xs text-gray-600">
                    {o.payment_method === 'stripe' ? '💳 Card' : o.payment_method === 'paypal' ? '🅿️ PayPal' : o.payment_method === 'cod' ? '💵 COD' : o.payment_method || '—'}
                  </td>
                  <td className="py-2 text-xs text-gray-600">
                    {o.delivery_method === 'standard' ? '📦 Standard' : o.delivery_method === 'express' ? '🚀 Express' : o.delivery_method === 'nextday' ? '⚡ Next-Day' : o.delivery_method || '—'}
                  </td>
                  <td className={`py-2 capitalize font-medium ${statusColor[o.status]}`}>{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
