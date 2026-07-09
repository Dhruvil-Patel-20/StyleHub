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
      setOrders(oRes.data.slice(0, 8));
    }).finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders.filter(o => o.is_paid && o.return_status !== 'refunded').reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const deliveryRate = orders.length ? Math.round((deliveredOrders / orders.length) * 100) : 0;
  const statusBreakdown = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'].map(status => ({
    status,
    count: orders.filter(o => (o.return_status === 'refunded' ? 'returned' : o.status) === status).length,
  }));
  const deliveryMethods = ['standard', 'express', 'nextday'].map(method => ({
    method,
    count: orders.filter(o => o.delivery_method === method).length,
  }));

  const getDisplayStatus = (o) => o.return_status === 'refunded' ? 'returned' : o.status;

  const statusColor = {
    pending: 'text-yellow-600',
    processing: 'text-blue-600',
    shipped: 'text-purple-600',
    delivered: 'text-green-600',
    cancelled: 'text-red-600',
    returned: 'text-red-800',
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-500">Admin control center</p>
          <h1 className="text-3xl font-bold text-gray-800 mt-1">Analytics overview</h1>
          <p className="text-gray-500 mt-2">Monitor sales, delivery performance and customer activity from one place.</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl px-5 py-4 shadow">
          <p className="text-sm text-red-100">Current promotion</p>
          <p className="font-semibold">Weekend offers are active across featured products.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Products', value: stats.products, link: '/admin/products', color: 'bg-blue-50' },
          { label: 'Total Orders', value: stats.orders, link: '/admin/orders', color: 'bg-green-50' },
          { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, link: '/admin/orders', color: 'bg-purple-50' },
        ].map(s => (
          <Link key={s.label} to={s.link} className={`${s.color} rounded-xl p-6 hover:shadow-md transition`}>
            <p className="text-3xl font-bold text-gray-800">{s.value}</p>
            <p className="text-gray-500 text-sm mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <Link to="/admin/products/new" className="bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-700">+ Add Product</Link>
        <Link to="/admin/products" className="border border-indigo-600 text-indigo-600 px-5 py-2 rounded-full hover:bg-indigo-50">Manage Products</Link>
        <Link to="/admin/orders" className="border border-indigo-600 text-indigo-600 px-5 py-2 rounded-full hover:bg-indigo-50">Manage Orders</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-gray-800">Delivery Analysis</h2>
            <span className="text-sm text-gray-500">{deliveryRate}% delivered</span>
          </div>
          <div className="space-y-3">
            {deliveryMethods.map(item => (
              <div key={item.method}>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span className="capitalize">{item.method}</span>
                  <span>{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${orders.length ? (item.count / orders.length) * 100 : 0}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-gray-800">Purchase Tracking</h2>
            <span className="text-sm text-gray-500">{pendingOrders} pending</span>
          </div>
          <div className="space-y-3">
            {statusBreakdown.map(item => (
              <div key={item.status}>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span className="capitalize">{item.status}</span>
                  <span>{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${item.status === 'delivered' ? 'bg-green-500' : item.status === 'processing' || item.status === 'shipped' ? 'bg-blue-500' : item.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${orders.length ? (item.count / orders.length) * 100 : 0}%`, opacity: item.status === 'returned' ? 0.6 : 1 }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Recent Orders</h2>
          <span className="text-sm text-gray-500">Latest activity</span>
        </div>
        {orders.length === 0 ? (
          <p className="text-gray-400 text-sm">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
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
                    <td className={`py-2 capitalize font-medium ${statusColor[getDisplayStatus(o)]}`}>{getDisplayStatus(o)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
