import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-red-100 text-red-900',
};
const getDisplayStatus = (o) => o.return_status === 'refunded' ? 'returned' : o.status;

const tabs = ['overview', 'banners', 'coupons', 'products', 'orders', 'returns', 'users', 'inventory', 'reviews'];

export default function AdminPanelPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [pRes, oRes, rRes, uRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/orders/all'),
        api.get('/orders/return-requests'),
        api.get('/users'),
      ]);
      setProducts(pRes.data.products);
      setOrders(oRes.data);
      setReturnRequests(rRes.data || []);
      setUsers(uRes.data);

      // Collect all reviews from products
      const allReviews = [];
      pRes.data.products.forEach(p => {
        if (p.reviews?.length) {
          p.reviews.forEach(r => allReviews.push({ ...r, productName: p.name }));
        }
      });
      setReviews(allReviews);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch { toast.error('Failed to delete product'); }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success('Order updated');
    } catch { toast.error('Failed to update order'); }
  };

  const handleUserRole = async (userId, role) => {
    try {
      await api.put(`/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed to delete user'); }
  };

  const refreshReturnRequests = async () => {
    try {
      console.debug('[Admin] Fetching return requests...');
      const { data } = await api.get('/orders/return-requests');
      console.debug('[Admin] Return requests fetched:', data?.length || 0, 'orders with requests');
      setReturnRequests(data || []);
    } catch (err) {
      console.error('[Admin] Failed to fetch return requests:', err);
      toast.error('Failed to refresh return requests');
    }
  };

  const handleApproveReturn = async (orderId, itemIndex) => {
    try {
      await api.put(`/orders/${orderId}/return/${itemIndex}/approve`, { note: 'Approved by admin' });
      toast.success('Return approved');
      await refreshReturnRequests();
    } catch (err) {
      console.error('Approve error:', err);
      toast.error(err?.response?.data?.message || 'Failed to approve return');
    }
  };

  const handleRejectReturn = async (orderId, itemIndex) => {
    try {
      await api.put(`/orders/${orderId}/return/${itemIndex}/reject`, { note: 'Rejected by admin' });
      toast.success('Return rejected');
      await refreshReturnRequests();
    } catch (err) {
      console.error('Reject error:', err);
      toast.error(err?.response?.data?.message || 'Failed to reject return');
    }
  };

  const handleRefundReturn = async (orderId, itemIndex) => {
    try {
      // Find the order to calculate refund amount for the item
      const order = returnRequests.find(o => o.id === orderId);
      if (!order) {
        toast.error('Order not found in state');
        return;
      }
      const item = order.items?.[itemIndex];
      if (!item) {
        toast.error('Item not found in order');
        return;
      }
      const refundAmount = Number(item.price || 0) * Number(item.quantity || 1);
      
      await api.put(`/orders/${orderId}/return/refund`, { itemIndexes: [itemIndex], refundAmount });
      toast.success('Refund processed');
      await refreshReturnRequests();
    } catch (err) {
      console.error('Refund error:', err);
      toast.error(err?.response?.data?.message || 'Failed to process refund');
    }
  };

  const totalRevenue = orders.filter(o => o.is_paid && o.return_status !== 'refunded').reduce((s, o) => s + o.total_price, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const pendingReturns = returnRequests.reduce((sum, o) => sum + (o.return_requests?.filter(i => i.return_status === 'requested' || (!i.return_status && i.return_requested)).length || 0), 0);
  const lowStockProducts = products.filter(p => p.stock <= 5).length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-5xl mb-4">⚙️</div>
        <p className="text-gray-600 font-medium">Loading Admin Panel...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-indigo-200 mt-1 text-sm">Full control over StyleHub</p>
          </div>
          <Link to="/admin/products/new"
            className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-lg hover:bg-indigo-50 transition text-sm">
            + Add Product
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSearch(''); }}
              className={`px-5 py-3 font-medium capitalize text-sm border-b-2 transition whitespace-nowrap ${
                activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-indigo-200">Operations pulse</p>
                  <h2 className="text-2xl font-bold mt-2">StyleHub is running smoothly — here is your daily control center.</h2>
                  <p className="text-sm text-indigo-200 mt-2 max-w-2xl">Monitor fulfillment, inventory pressure, and account activity from one refined overview.</p>
                </div>
                <div className="rounded-xl bg-white/15 px-4 py-3 text-sm backdrop-blur">
                  <p className="font-semibold">Today’s focus</p>
                  <p className="text-indigo-200 mt-1">{pendingOrders} orders need attention</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: users.length, icon: '👥', color: 'from-blue-500 to-blue-600' },
                { label: 'Total Products', value: products.length, icon: '🛍️', color: 'from-purple-500 to-purple-600' },
                { label: 'Total Orders', value: orders.length, icon: '📦', color: 'from-indigo-500 to-indigo-600' },
                { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: '💰', color: 'from-green-500 to-green-600' },
              ].map(card => (
                <div key={card.label} className={`bg-gradient-to-br ${card.color} text-white rounded-xl shadow p-5`}>
                  <div className="text-3xl mb-2">{card.icon}</div>
                  <p className="text-white/80 text-xs font-medium">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 flex items-center gap-4">
                <div className="text-4xl">⏳</div>
                <div>
                  <p className="font-semibold text-yellow-800">Pending Orders</p>
                  <p className="text-3xl font-bold text-yellow-700">{pendingOrders}</p>
                  <button onClick={() => setActiveTab('orders')} className="text-xs text-yellow-600 hover:underline mt-1">View all →</button>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4">
                <div className="text-4xl">⚠️</div>
                <div>
                  <p className="font-semibold text-red-800">Low Stock Products</p>
                  <p className="text-3xl font-bold text-red-700">{lowStockProducts}</p>
                  <button onClick={() => setActiveTab('inventory')} className="text-xs text-red-600 hover:underline mt-1">View all →</button>
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex items-center gap-4">
                <div className="text-4xl">↩</div>
                <div>
                  <p className="font-semibold text-indigo-800">Pending Returns</p>
                  <p className="text-3xl font-bold text-indigo-700">{pendingReturns}</p>
                  <button onClick={() => setActiveTab('returns')} className="text-xs text-indigo-600 hover:underline mt-1">Review →</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Recent Orders</h2>
                <button onClick={() => setActiveTab('orders')} className="text-sm text-indigo-600 hover:underline">View all</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b">
                    <th className="px-4 py-2 text-left text-gray-600">Order ID</th>
                    <th className="px-4 py-2 text-left text-gray-600">Customer</th>
                    <th className="px-4 py-2 text-left text-gray-600">Total</th>
                    <th className="px-4 py-2 text-left text-gray-600">Status</th>
                    <th className="px-4 py-2 text-left text-gray-600">Date</th>
                  </tr></thead>
                  <tbody>
                    {orders.slice(0, 6).map(o => (
                      <tr key={o.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3">{o.users?.name || '—'}</td>
                        <td className="px-4 py-3 font-semibold">${o.total_price.toFixed(2)}</td>
      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[getDisplayStatus(o)]}`}>{getDisplayStatus(o)}</span></td>
                        <td className="px-4 py-3 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Recent Users</h2>
                <button onClick={() => setActiveTab('users')} className="text-sm text-indigo-600 hover:underline">View all</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b">
                    <th className="px-4 py-2 text-left text-gray-600">Name</th>
                    <th className="px-4 py-2 text-left text-gray-600">Email</th>
                    <th className="px-4 py-2 text-left text-gray-600">Role</th>
                    <th className="px-4 py-2 text-left text-gray-600">Joined</th>
                  </tr></thead>
                  <tbody>
                    {users.slice(0, 5).map(u => (
                      <tr key={u.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin' ? 'bg-red-100 text-red-700' :
                            u.role === 'seller' ? 'bg-purple-100 text-purple-700' :
                            'bg-green-100 text-green-700'}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'returns' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Return Requests</h2>
                <p className="text-sm text-gray-500">Review customer return requests and process refunds.</p>
              </div>
              <button onClick={refreshReturnRequests} className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Refresh requests</button>
            </div>

            {returnRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">No return requests at the moment.</div>
            ) : (
              <div className="space-y-4">
                {returnRequests.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl shadow p-6 border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Order</p>
                        <p className="font-semibold">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-gray-500">Customer: {order.shipping_address?.fullName || order.users?.name || 'Unknown'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="font-semibold">${Number(order.total_price).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {order.return_requests.map((item) => {
                        const refundAmt = (Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2);
                        const canRefund = item.return_status === 'approved';
                        const canApprove = item.return_status === 'requested' || (!item.return_status && item.return_requested);
                        const canReject = canApprove;
                        return (
                        <div key={item.itemIndex} className="rounded-xl border border-gray-200 p-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                          <div className="flex gap-3">
                            {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />}
                            <div>
                              <p className="font-semibold">{item.name}</p>
                              {item.size && <p className="text-xs text-gray-400">Size: {item.size}</p>}
                              <p className="text-sm text-gray-500">Qty: {item.quantity} · Refund: <span className="font-medium text-gray-700">${refundAmt}</span></p>
                              <p className="text-sm text-gray-500">Reason: {item.return_reason || 'Not specified'}</p>
                              <p className="text-sm text-gray-500">Status: <span className={`font-semibold capitalize ${
                                item.return_status === 'approved' ? 'text-green-600' :
                                item.return_status === 'rejected' ? 'text-red-600' :
                                item.return_status === 'refunded' ? 'text-indigo-600' :
                                'text-yellow-600'}`}>{item.return_status || 'requested'}</span></p>
                              {item.return_admin_note && <p className="text-sm text-gray-500">Note: {item.return_admin_note}</p>}
                              {item.requested_at && <p className="text-xs text-gray-400">Requested: {new Date(item.requested_at).toLocaleDateString()}</p>}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-end items-start">
                            <button onClick={() => handleApproveReturn(order.id, item.itemIndex)} disabled={!canApprove} className="text-xs bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed">Approve</button>
                            <button onClick={() => handleRejectReturn(order.id, item.itemIndex)} disabled={!canReject} className="text-xs bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed">Reject</button>
                            <button
                              onClick={() => handleRefundReturn(order.id, item.itemIndex)}
                              disabled={!canRefund}
                              title={!canRefund ? 'Approve the return first before processing refund' : ''}
                              className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed">
                              Process Refund ${refundAmt}
                            </button>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6 border border-indigo-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Banner Offers</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage homepage promotions and banner redirects from a dedicated page.</p>
                </div>
                <Link to="/admin/banners" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">Open Banner Offers</Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6 border border-indigo-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Coupons</h2>
                  <p className="text-sm text-gray-500 mt-1">Create and manage discount codes for customers.</p>
                </div>
                <Link to="/admin/coupons" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">Open Coupons</Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                className="border rounded-lg px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <Link to="/admin/products/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium whitespace-nowrap">
                + Add Product
              </Link>
            </div>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left">Image</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Sub-Category</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-left">Returns</th>
                  <th className="px-4 py-3 text-left">Featured</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr></thead>
                <tbody>
                  {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <img src={p.images?.[0] || 'https://via.placeholder.com/40'} alt={p.name} className="w-10 h-10 object-cover rounded-lg" />
                      </td>
                      <td className="px-4 py-3 font-medium max-w-[160px] truncate">{p.name}</td>
                      <td className="px-4 py-3 capitalize">{p.category}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.sub_category || '—'}</td>
                      <td className="px-4 py-3 font-semibold">${p.price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          p.stock > 20 ? 'bg-green-100 text-green-700' :
                          p.stock > 5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'}`}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        {p.is_returnable === true
                          ? <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">↩ {p.return_window_days ?? 7}d</span>
                          : <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">🚫 No</span>}
                      </td>
                      <td className="px-4 py-3">{p.featured ? '⭐' : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link to={`/admin/products/${p.id}/edit`} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-200">Edit</Link>
                          <button onClick={() => handleDeleteProduct(p.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs hover:bg-red-200">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && <p className="text-center text-gray-500 py-8">No products found</p>}
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID or customer..."
              className="border rounded-lg px-4 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left">Order ID</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-left">Delivery</th>
                  <th className="px-4 py-3 text-left">Paid</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr></thead>
                <tbody>
                  {orders
                    .filter(o => o.id.includes(search) || o.users?.name?.toLowerCase().includes(search.toLowerCase()))
                    .map(o => (
                    <tr key={o.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3">{o.users?.name || '—'}<br/><span className="text-xs text-gray-400">{o.users?.email}</span></td>
                      <td className="px-4 py-3">{o.items.length}</td>
                      <td className="px-4 py-3 font-semibold">${o.total_price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-700">
                          {o.payment_method === 'stripe' ? '💳 Card' : o.payment_method === 'paypal' ? '🅿️ PayPal' : o.payment_method === 'cod' ? '💵 COD' : o.payment_method || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-700">
                          {o.delivery_method === 'standard' ? '📦 Standard' : o.delivery_method === 'express' ? '🚀 Express' : o.delivery_method === 'nextday' ? '⚡ Next-Day' : o.delivery_method || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${o.is_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {o.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select value={getDisplayStatus(o)} onChange={e => handleOrderStatus(o.id, e.target.value)}
                          className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${statusColors[getDisplayStatus(o)]}`}>
                          {['pending','processing','shipped','delivered','cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                          {getDisplayStatus(o) === 'returned' && <option value="returned">returned</option>}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Link to={`/orders/${o.id}`} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-xs hover:bg-indigo-200">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <p className="text-center text-gray-500 py-8">No orders found</p>}
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
              className="border rounded-lg px-4 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr></thead>
                <tbody>
                  {users
                    .filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
                    .map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <select value={u.role} onChange={e => handleUserRole(u.id, e.target.value)}
                          className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${
                            u.role === 'admin' ? 'bg-red-100 text-red-700' :
                            u.role === 'seller' ? 'bg-purple-100 text-purple-700' :
                            'bg-green-100 text-green-700'}`}>
                          <option value="client">client</option>
                          <option value="seller">seller</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteUser(u.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs hover:bg-red-200">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p className="text-center text-gray-500 py-8">No users found</p>}
            </div>
          </div>
        )}

        {/* ── INVENTORY ── */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'In Stock', count: products.filter(p => p.stock > 20).length, color: 'bg-green-50 border-green-200 text-green-700' },
                { label: 'Low Stock (≤20)', count: products.filter(p => p.stock > 5 && p.stock <= 20).length, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                { label: 'Critical (≤5)', count: products.filter(p => p.stock <= 5).length, color: 'bg-red-50 border-red-200 text-red-700' },
              ].map(s => (
                <div key={s.label} className={`border rounded-xl p-5 ${s.color}`}>
                  <p className="font-semibold">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.count}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr></thead>
                <tbody>
                  {[...products].sort((a, b) => a.stock - b.stock).map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 capitalize">{p.category}</td>
                      <td className="px-4 py-3 font-bold">{p.stock}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          p.stock > 20 ? 'bg-green-100 text-green-700' :
                          p.stock > 5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'}`}>
                          {p.stock > 20 ? 'In Stock' : p.stock > 5 ? 'Low Stock' : 'Critical'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/products/${p.id}/edit`} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-xs hover:bg-indigo-200">Update Stock</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── REVIEWS ── */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-800">All Customer Reviews</h2>
              <p className="text-sm text-gray-500 mt-1">{reviews.length} total reviews</p>
            </div>
            {reviews.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No reviews yet</p>
            ) : (
              <div className="divide-y">
                {reviews.map(r => (
                  <div key={r.id} className="p-5 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{r.name}</p>
                        <p className="text-xs text-indigo-600 mt-0.5">{r.productName}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-yellow-400 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                          <span className="text-xs text-gray-400">({r.rating}/5)</span>
                        </div>
                        {r.comment && <p className="text-sm text-gray-600 mt-2">{r.comment}</p>}
                      </div>
                      <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
