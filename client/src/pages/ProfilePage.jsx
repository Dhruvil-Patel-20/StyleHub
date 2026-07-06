import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

const getTabs = (role) => {
  const base = ['account', 'orders', 'wishlist', 'security'];
  if (role === 'admin') return [...base, 'admin'];
  if (role === 'seller') return [...base, 'seller'];
  return base;
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ProfilePage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const tabs = getTabs(user?.role);
  const [activeTab, setActiveTab] = useState('account');
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [orders, setOrders] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'wishlist') fetchWishlist();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data } = await api.get('/orders/myorders');
      setOrders(data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoadingOrders(false); }
  };

  const fetchWishlist = async () => {
    if (!user?.wishlist?.length) return;
    setLoadingWishlist(true);
    try {
      const res = await Promise.all(user.wishlist.map(id => api.get(`/products/${id}`)));
      setWishlistProducts(res.map(r => r.data));
    } catch { toast.error('Failed to load wishlist'); }
    finally { setLoadingWishlist(false); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { name: form.name, email: form.email });
      login(data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) return toast.error('Passwords do not match');
    if (passwords.newPass.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { password: passwords.newPass });
      login(data);
      setPasswords({ current: '', newPass: '', confirm: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const handleRemoveWishlist = async (productId) => {
    try {
      await api.put(`/auth/wishlist/${productId}`);
      setWishlistProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Removed from wishlist');
    } catch { toast.error('Failed to remove'); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      await api.delete('/users/me');
      logout();
      navigate('/');
      toast.success('Account deleted');
    } catch { toast.error('Failed to delete account'); }
  };

  const avatarLetter = user?.name?.charAt(0).toUpperCase();
  const roleColor = user?.role === 'admin' ? 'bg-red-100 text-red-700' : user?.role === 'seller' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 h-36"></div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 pb-16">
        {/* Profile Card Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-end gap-4">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-white shrink-0">
            {avatarLetter}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-800">{user?.name}</h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${roleColor}`}>{user?.role}</span>
              <span className="text-gray-400 text-xs">Member since {new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex gap-3">
            {user?.role === 'seller' && (
              <Link to="/seller" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition">Seller Dashboard</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition">Admin Panel</Link>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Orders', value: orders.length || '—', icon: '📦' },
            { label: 'Wishlist Items', value: user?.wishlist?.length || 0, icon: '❤️' },
            { label: 'Account Type', value: user?.role, icon: '👤' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="text-xl font-bold text-gray-800 capitalize">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6 bg-white rounded-t-xl px-4 shadow-sm overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 font-medium capitalize text-sm border-b-2 transition whitespace-nowrap ${
                activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}>
              {tab === 'account' ? '👤 Account'
                : tab === 'orders' ? '📦 Orders'
                : tab === 'wishlist' ? '❤️ Wishlist'
                : tab === 'security' ? '🔒 Security'
                : tab === 'admin' ? '🛡️ Admin Panel'
                : '🏪 Seller Dashboard'}
            </button>
          ))}
        </div>

        {/* ── ACCOUNT TAB ── */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-5">Personal Information</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Role</label>
                  <input value={user?.role} disabled
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-400 text-sm capitalize cursor-not-allowed" />
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={saving}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Links</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'My Orders', icon: '📦', to: '/orders' },
                  { label: 'Wishlist', icon: '❤️', to: '/wishlist' },
                  { label: 'Cart', icon: '🛒', to: '/cart' },
                  { label: 'Browse Products', icon: '🛍️', to: '/products' },
                ].map(l => (
                  <Link key={l.label} to={l.to}
                    className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition text-center">
                    <span className="text-2xl">{l.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{l.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">My Orders</h2>
              <span className="text-sm text-gray-500">{orders.length} total</span>
            </div>
            {loadingOrders ? (
              <div className="text-center py-12 text-gray-400">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-600 font-medium mb-2">No orders yet</p>
                <Link to="/products" className="bg-indigo-600 text-white px-6 py-2 rounded-full text-sm hover:bg-indigo-700">Start Shopping</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <Link key={order.id} to={`/orders/${order.id}`}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-xl">📦</div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Order #{order.id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{order.items.length} item(s) · {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${order.total_price?.toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full capitalize mt-1 inline-block ${statusColors[order.status]}`}>{order.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WISHLIST TAB ── */}
        {activeTab === 'wishlist' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">My Wishlist</h2>
              <span className="text-sm text-gray-500">{wishlistProducts.length} items</span>
            </div>
            {loadingWishlist ? (
              <div className="text-center py-12 text-gray-400">Loading wishlist...</div>
            ) : wishlistProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">❤️</div>
                <p className="text-gray-600 font-medium mb-2">Your wishlist is empty</p>
                <Link to="/products" className="bg-indigo-600 text-white px-6 py-2 rounded-full text-sm hover:bg-indigo-700">Browse Products</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wishlistProducts.map(p => (
                  <div key={p.id} className="flex gap-4 border border-gray-200 rounded-xl p-3 hover:border-indigo-300 transition">
                    <img src={p.images?.[0] || 'https://via.placeholder.com/80'} alt={p.name}
                      className="w-20 h-20 object-cover rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-indigo-500 capitalize mt-0.5">{p.category}</p>
                      <p className="font-bold text-gray-900 mt-1">${p.price?.toFixed(2)}</p>
                      <div className="flex gap-2 mt-2">
                        <Link to={`/product/${p.id}`} className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full hover:bg-indigo-700">View</Link>
                        <button onClick={() => handleRemoveWishlist(p.id)} className="bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full hover:bg-red-200">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ADMIN TAB ── */}
        {activeTab === 'admin' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Admin Panel</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Dashboard', icon: '📊', to: '/admin/dashboard' },
                { label: 'Products', icon: '🛍️', to: '/admin/products' },
                { label: 'Orders', icon: '📦', to: '/admin/orders' },
                { label: 'Overview', icon: '🔧', to: '/admin' },
              ].map(l => (
                <Link key={l.label} to={l.to}
                  className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition text-center">
                  <span className="text-2xl">{l.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{l.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── SELLER TAB ── */}
        {activeTab === 'seller' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Seller Dashboard</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Dashboard', icon: '📊', to: '/seller' },
                { label: 'Add Product', icon: '➕', to: '/seller/products/new' },
                { label: 'My Products', icon: '🛍️', to: '/seller' },
              ].map(l => (
                <Link key={l.label} to={l.to}
                  className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition text-center">
                  <span className="text-2xl">{l.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{l.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-5">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" placeholder="••••••••" value={passwords.newPass}
                    onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input type="password" placeholder="••••••••" value={passwords.confirm}
                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                {passwords.newPass && passwords.confirm && (
                  <p className={`text-xs font-medium ${passwords.newPass === passwords.confirm ? 'text-green-600' : 'text-red-500'}`}>
                    {passwords.newPass === passwords.confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
                <div className="flex justify-end">
                  <button type="submit" disabled={saving}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-50">
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Active Session */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Active Session</h2>
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Current Session</p>
                    <p className="text-xs text-gray-500">Logged in as {user?.email}</p>
                  </div>
                </div>
                <button onClick={() => { logout(); navigate('/login'); }}
                  className="bg-red-100 text-red-600 text-xs px-4 py-2 rounded-lg hover:bg-red-200 transition font-medium">
                  Logout
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl shadow p-6 border border-red-200">
              <h2 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h2>
              <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
              <button onClick={handleDeleteAccount}
                className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition text-sm font-medium">
                Delete My Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
