import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusColor = {
  pending: 'text-yellow-600', processing: 'text-blue-600',
  shipped: 'text-purple-600', delivered: 'text-green-600', cancelled: 'text-red-600',
};
const statusBg = {
  pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paidFilter, setPaidFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    api.get('/orders/all').then(res => setOrders(res.data));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/orders/${id}/status`, { status });
      setOrders(orders.map(o => o.id === id ? { ...o, status: data.status } : o));
      toast.success('Status updated');
    } catch { toast.error('Update failed'); }
  };

  const filtered = orders
    .filter(o => !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.users?.name?.toLowerCase().includes(search.toLowerCase()) || o.users?.email?.toLowerCase().includes(search.toLowerCase()))
    .filter(o => !statusFilter || o.status === statusFilter)
    .filter(o => !paidFilter || (paidFilter === 'paid' ? o.is_paid : !o.is_paid))
    .filter(o => !paymentFilter || o.payment_method === paymentFilter)
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sort === 'price_desc') return b.total_price - a.total_price;
      if (sort === 'price_asc') return a.total_price - b.total_price;
      return 0;
    });

  const hasFilters = search || statusFilter || paidFilter || paymentFilter;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">All Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search ID, customer, email..."
          className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400 w-56" />

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400">
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>

        <select value={paidFilter} onChange={e => setPaidFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400">
          <option value="">Paid / Unpaid</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>

        <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400">
          <option value="">All Payment Methods</option>
          <option value="stripe">💳 Card</option>
          <option value="paypal">🅿️ PayPal</option>
          <option value="cod">💵 COD</option>
        </select>

        <select value={sort} onChange={e => setSort(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price_desc">Highest Amount</option>
          <option value="price_asc">Lowest Amount</option>
        </select>

        {hasFilters && <button onClick={() => { setSearch(''); setStatusFilter(''); setPaidFilter(''); setPaymentFilter(''); }} className="text-xs text-red-500 hover:underline px-2">Clear</button>}
        <span className="text-xs text-gray-400 self-center ml-auto">{filtered.length} of {orders.length} orders</span>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statuses.map(s => {
          const count = orders.filter(o => o.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border capitalize transition ${statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : `${statusBg[s]} border-transparent`}`}>
              {s} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link to={`/orders/${o.id}`} className="text-indigo-600 hover:underline">#{o.id.slice(-8).toUpperCase()}</Link>
                </td>
                <td className="px-4 py-3">
                  <p>{o.users?.name || 'N/A'}</p>
                  <p className="text-xs text-gray-400">{o.users?.email}</p>
                </td>
                <td className="px-4 py-3 font-semibold">${Number(o.total_price).toFixed(2)}</td>
                <td className="px-4 py-3 text-xs text-gray-700">
                  {o.payment_method === 'stripe' ? '💳 Card' : o.payment_method === 'paypal' ? '🅿️ PayPal' : o.payment_method === 'cod' ? '💵 COD' : o.payment_method || '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">
                  {o.delivery_method === 'standard' ? '📦 Standard' : o.delivery_method === 'express' ? '🚀 Express' : o.delivery_method === 'nextday' ? '⚡ Next-Day' : o.delivery_method || '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${o.is_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {o.is_paid ? '✓ Paid' : 'Unpaid'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                    className={`border rounded px-2 py-1 text-xs capitalize ${statusColor[o.status]}`}>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-10">No orders match your filters.</p>}
      </div>
    </div>
  );
}
