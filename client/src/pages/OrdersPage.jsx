import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const statusColor = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-red-100 text-red-800',
};
const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const getDisplayStatus = (order) => order.return_status === 'refunded' ? 'returned' : order.status;

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    api.get('/orders/myorders').then(res => setOrders(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = orders
    .filter(o => !statusFilter || getDisplayStatus(o) === statusFilter)
    .filter(o => !search || o.id.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sort === 'price_desc') return b.total_price - a.total_price;
      if (sort === 'price_asc') return a.total_price - b.total_price;
      return 0;
    });

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>

      {orders.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID..."
            className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400 w-48"
          />
          {/* Status pills */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setStatusFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${!statusFilter ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}>
              All
            </button>
            {statuses.map(s => (
              <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border capitalize transition ${statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}>
                {s}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400 ml-auto">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_desc">Highest Amount</option>
            <option value="price_asc">Lowest Amount</option>
          </select>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p>No orders yet.</p>
          <Link to="/products" className="text-indigo-600 hover:underline mt-2 block">Start Shopping</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-3">🔍</p>
          <p>No orders match your filters.</p>
          <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="text-indigo-600 hover:underline mt-2 block mx-auto">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <Link key={order.id} to={`/orders/${order.id}`} className="block bg-white rounded-xl shadow p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="font-semibold text-gray-800 mt-1">{order.items?.length} item(s)</p>
                  <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${Number(order.total_price).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize mt-1 inline-block ${statusColor[getDisplayStatus(order)]}`}>{getDisplayStatus(order)}</span>
                  {order.is_paid && <p className="text-xs text-green-600 mt-1">✓ Paid</p>}
                  {/* Cancel button inline */}
                  {user && user.id === order.user_id && !['shipped', 'delivered', 'cancelled'].includes(order.status) && (
                    <div className="mt-2">
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!confirm('Cancel this order?')) return;
                          try {
                            await api.put(`/orders/${order.id}/cancel`);
                            // refresh list
                            const { data } = await api.get('/orders/myorders');
                            setOrders(data);
                            alert('Order cancelled');
                          } catch (err) {
                            alert(err?.response?.data?.message || err.message || 'Failed to cancel order');
                          }
                        }}
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
