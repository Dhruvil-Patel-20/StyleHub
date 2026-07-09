import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
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

const tabs = ['overview', 'products', 'orders', 'inventory', 'reviews'];

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [pRes, oRes] = await Promise.all([
        api.get('/products/myproducts'),
        api.get('/orders/sellerorders'),
      ]);
      setProducts(pRes.data);
      setOrders(oRes.data);
    } catch (err) {
      toast.error('Failed to load seller data');
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

  // Derived stats
  const totalRevenue = orders.filter(o => o.is_paid && o.return_status !== 'refunded').reduce((s, o) => s + Number(o.total_price || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const processingOrders = orders.filter(o => o.status === 'processing').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const lowStock = products.filter(p => p.stock <= 5).length;
  const allReviews = products.flatMap(p => (p.reviews || []).map(r => ({ ...r, productName: p.name })));
  const avgRating = products.length ? (products.reduce((s, p) => s + (p.rating || 0), 0) / products.length).toFixed(1) : '0.0';
  const avgOrderValue = orders.length ? (totalRevenue / orders.length).toFixed(2) : '0.00';
  const deliveryRate = orders.length ? Math.round((deliveredOrders / orders.length) * 100) : 0;
  const statusBreakdown = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'].map(status => ({
    status,
    count: orders.filter(o => getDisplayStatus(o) === status).length,
  }));
  const deliveryMethods = ['standard', 'express', 'nextday'].map(method => ({
    method,
    count: orders.filter(o => o.delivery_method === method).length,
  }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-5xl mb-4">🏪</div>
        <p className="text-gray-600 font-medium">Loading Seller Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Seller Dashboard</h1>
            <p className="text-purple-200 mt-1 text-sm">Welcome back, {user?.name} 👋</p>
          </div>
          <Link to="/seller/products/new"
            className="bg-white text-purple-700 font-semibold px-4 py-2 rounded-lg hover:bg-purple-50 transition text-sm">
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
                activeTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-purple-100">Seller momentum</p>
                  <h2 className="text-2xl font-bold mt-2">Your storefront is trending — keep the offers rolling.</h2>
                  <p className="text-sm text-purple-100 mt-2 max-w-2xl">Bundle top sellers, keep inventory healthy, and protect your delivery promises to strengthen repeat purchases.</p>
                </div>
                <div className="rounded-xl bg-white/15 px-4 py-3 text-sm backdrop-blur">
                  <p className="font-semibold">Live offer</p>
                  <p className="text-purple-100 mt-1">Free shipping for bundles this week</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'My Products', value: products.length, icon: '🛍️', color: 'from-purple-500 to-purple-600' },
                { label: 'Total Orders', value: orders.length, icon: '📦', color: 'from-indigo-500 to-indigo-600' },
                { label: 'Revenue Earned', value: `$${totalRevenue.toFixed(2)}`, icon: '💰', color: 'from-green-500 to-green-600' },
                { label: 'Avg Rating', value: `${avgRating} ★`, icon: '⭐', color: 'from-yellow-500 to-yellow-600' },
              ].map(card => (
                <div key={card.label} className={`bg-gradient-to-br ${card.color} text-white rounded-xl shadow p-5`}>
                  <div className="text-3xl mb-2">{card.icon}</div>
                  <p className="text-white/80 text-xs font-medium">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p className="text-3xl font-bold text-red-700">{lowStock}</p>
                  <button onClick={() => setActiveTab('inventory')} className="text-xs text-red-600 hover:underline mt-1">View all →</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Delivery Analysis</h2>
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
                  <h2 className="text-lg font-bold text-gray-800">Purchase Tracking</h2>
                  <span className="text-sm text-gray-500">{totalRevenue.toFixed(2)} revenue</span>
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
                <h2 className="text-lg font-bold text-gray-800">Recent Orders</h2>
                <button onClick={() => setActiveTab('orders')} className="text-sm text-purple-600 hover:underline">View all</button>
              </div>
              {orders.length === 0 ? (
                <p className="text-gray-500 text-sm">No orders yet</p>
              ) : (
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
                      {orders.slice(0, 5).map(o => (
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
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Top Rated Products</h2>
                <button onClick={() => setActiveTab('products')} className="text-sm text-purple-600 hover:underline">View all</button>
              </div>
              {products.length === 0 ? (
                <p className="text-gray-500 text-sm">No products yet. <Link to="/seller/products/new" className="text-purple-600 hover:underline">Add your first product</Link></p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[...products].sort((a, b) => b.rating - a.rating).slice(0, 3).map(p => (
                    <div key={p.id} className="border rounded-xl overflow-hidden hover:shadow-md transition">
                      <img src={p.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'} alt={p.name} className="w-full h-36 object-cover" />
                      <div className="p-3">
                        <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                        <p className="text-purple-600 font-bold text-sm mt-1">${p.price.toFixed(2)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-yellow-400 text-xs">{'★'.repeat(Math.round(p.rating))}{'☆'.repeat(5 - Math.round(p.rating))}</span>
                          <span className="text-xs text-gray-400">({p.num_reviews})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                className="border rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-purple-400" />
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-purple-400">
                <option value="">All Categories</option>
                {['men','women','kids','footwear','jewelry','accessories','sportswear','beauty'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
              <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-purple-400">
                <option value="">All Stock</option>
                <option value="instock">In Stock (&gt;20)</option>
                <option value="low">Low Stock (1–20)</option>
                <option value="out">Out of Stock</option>
              </select>
              {(search || categoryFilter || stockFilter) && (
                <button onClick={() => { setSearch(''); setCategoryFilter(''); setStockFilter(''); }} className="text-xs text-red-500 hover:underline">Clear</button>
              )}
              <Link to="/seller/products/new" className="bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 text-sm font-medium whitespace-nowrap ml-auto">
                + Add Product
              </Link>
            </div>
            {products.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-600 font-medium mb-2">No products yet</p>
                <Link to="/seller/products/new" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 text-sm">
                  Add Your First Product
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left">Image</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Sub-Category</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-left">Stock</th>
                    <th className="px-4 py-3 text-left">Rating</th>
                    <th className="px-4 py-3 text-left">Returns</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr></thead>
                  <tbody>
                    {products
                    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
                    .filter(p => !categoryFilter || p.category === categoryFilter)
                    .filter(p => {
                      if (stockFilter === 'instock') return p.stock > 20;
                      if (stockFilter === 'low') return p.stock > 0 && p.stock <= 20;
                      if (stockFilter === 'out') return p.stock === 0;
                      return true;
                    })
                    .map(p => (
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
                          <span className="text-yellow-500 text-xs">{'★'.repeat(Math.round(p.rating))}</span>
                          <span className="text-gray-400 text-xs ml-1">({p.num_reviews})</span>
                        </td>
                        <td className="px-4 py-3">
                          {p.is_returnable === true ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                              ↩ {p.return_window_days ?? 7}d
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                              🚫 No
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link to={`/seller/products/${p.id}/edit`} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-200">Edit</Link>
                            <button onClick={() => handleDeleteProduct(p.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs hover:bg-red-200">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS ── */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID or customer..."
                className="border rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-purple-400" />
              <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-purple-400">
                <option value="">All Statuses</option>
                {['pending','processing','shipped','delivered','cancelled','returned'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
              {(search || orderStatusFilter) && (
                <button onClick={() => { setSearch(''); setOrderStatusFilter(''); }} className="text-xs text-red-500 hover:underline">Clear</button>
              )}
            </div>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              {orders.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No orders yet</p>
              ) : (
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
                  </tr></thead>
                  <tbody>
                    {orders
                      .filter(o => !search || o.id.includes(search) || o.users?.name?.toLowerCase().includes(search.toLowerCase()))
                      .filter(o => !orderStatusFilter || o.status === orderStatusFilter)
                      .map(o => (
                      <tr key={o.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3">
                          {o.users?.name || '—'}
                          <br /><span className="text-xs text-gray-400">{o.users?.email}</span>
                        </td>
                        <td className="px-4 py-3">{o.items.length}</td>
                        <td className="px-4 py-3 font-semibold">${o.total_price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {o.payment_method === 'stripe' ? '💳 Card' : o.payment_method === 'paypal' ? '🅿️ PayPal' : o.payment_method === 'cod' ? '💵 COD' : o.payment_method || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {o.delivery_method === 'standard' ? '📦 Standard' : o.delivery_method === 'express' ? '🚀 Express' : o.delivery_method === 'nextday' ? '⚡ Next-Day' : o.delivery_method || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${o.is_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {o.is_paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[getDisplayStatus(o)]}`}>{getDisplayStatus(o)}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
                        <Link to={`/seller/products/${p.id}/edit`} className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs hover:bg-purple-200">Update Stock</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && <p className="text-center text-gray-500 py-8">No products found</p>}
            </div>
          </div>
        )}

        {/* ── REVIEWS ── */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Reviews', value: allReviews.length, color: 'bg-purple-50 border-purple-200 text-purple-700' },
                { label: 'Average Rating', value: `${avgRating} / 5`, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                { label: '5 Star Reviews', value: allReviews.filter(r => r.rating === 5).length, color: 'bg-green-50 border-green-200 text-green-700' },
              ].map(s => (
                <div key={s.label} className={`border rounded-xl p-5 ${s.color}`}>
                  <p className="font-semibold">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-lg font-bold text-gray-800">Customer Reviews</h2>
                <p className="text-sm text-gray-500 mt-1">{allReviews.length} total reviews across all your products</p>
              </div>
              {allReviews.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No reviews yet</p>
              ) : (
                <div className="divide-y">
                  {allReviews.map(r => (
                    <div key={r.id} className="p-5 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">{r.name}</p>
                          <p className="text-xs text-purple-600 mt-0.5">on: {r.productName}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-yellow-400 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                            <span className="text-xs text-gray-400">({r.rating}/5)</span>
                          </div>
                          {r.comment && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-3">{r.comment}</p>}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
