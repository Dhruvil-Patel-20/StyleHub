import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const empty = { code: '', description: '', type: 'percent', value: 10, min_order_value: '', start_date: '', end_date: '', max_uses: null, max_per_user: null, one_per_user: false, first_order_only: false, free_shipping: false, is_active: true };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/coupons/all');
      setCoupons(data || []);
    } catch (err) {
      toast.error('Failed to load coupons');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, code: form.code.toUpperCase().trim(), value: Number(form.value) };
      if (editId) {
        const { data } = await api.put(`/coupons/${editId}`, payload);
        setCoupons(prev => prev.map(c => c.id === editId ? data : c));
        toast.success('Coupon updated');
      } else {
        const { data } = await api.post('/coupons', payload);
        setCoupons(prev => [data, ...prev]);
        toast.success('Coupon created');
      }
      setForm(empty); setEditId(null); setShowForm(false);
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to save coupon'); }
  };

  const handleEdit = (c) => {
    setForm({
      code: c.code || '',
      description: c.description || '',
      type: c.type || 'percent',
      value: c.value || 0,
      min_order_value: c.min_order_value || '',
      start_date: c.start_date ? c.start_date.slice(0,16) : '',
      end_date: c.end_date ? c.end_date.slice(0,16) : '',
      max_uses: c.max_uses,
      max_per_user: c.max_per_user,
      one_per_user: c.one_per_user || false,
      first_order_only: c.first_order_only || false,
      free_shipping: c.free_shipping || false,
      is_active: c.is_active,
    });
    setEditId(c.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await api.patch(`/coupons/${id}/toggle`);
      setCoupons(prev => prev.map(c => c.id === id ? data : c));
      toast.success(`Coupon ${data.is_active ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to toggle coupon'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success('Coupon deleted');
    } catch { toast.error('Failed to delete coupon'); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">Manage discount codes for customers</p>
        </div>
        <button onClick={() => { setForm(empty); setEditId(null); setShowForm(s => !s); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">{showForm && !editId ? 'Cancel' : '+ New Coupon'}</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow p-6 mb-8 border border-indigo-100">
          <h2 className="font-semibold text-gray-800 mb-4">{editId ? 'Edit Coupon' : 'Create Coupon'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Code *</label>
              <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed ($)</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Value *</label>
              <input required type="number" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Min order value</label>
              <input type="number" min="0" value={form.min_order_value} onChange={e => setForm(f => ({ ...f, min_order_value: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Start Date</label>
              <input type="datetime-local" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">End Date</label>
              <input type="datetime-local" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Max Uses</label>
              <input type="number" min="0" value={form.max_uses || ''} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value ? Number(e.target.value) : null }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Max Uses Per User</label>
              <input type="number" min="0" value={form.max_per_user || ''} onChange={e => setForm(f => ({ ...f, max_per_user: e.target.value ? Number(e.target.value) : null }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={form.one_per_user} onChange={e => setForm(f => ({ ...f, one_per_user: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
              <label className="text-sm text-gray-700">One use per user</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={form.first_order_only} onChange={e => setForm(f => ({ ...f, first_order_only: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
              <label className="text-sm text-gray-700">First order only</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={form.free_shipping} onChange={e => setForm(f => ({ ...f, free_shipping: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
              <label className="text-sm text-gray-700">Free shipping</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
              <label className="text-sm text-gray-700">Active</label>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg">{editId ? 'Update Coupon' : 'Create Coupon'}</button>
              <button type="button" onClick={() => { setForm(empty); setEditId(null); setShowForm(false); }} className="border border-gray-300 px-6 py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No coupons yet.</div>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => (
            <div key={c.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{c.code} <span className="text-xs text-gray-500">{c.description}</span></p>
                <p className="text-xs text-gray-500">{c.type === 'percent' ? `${c.value}%` : c.type === 'free_shipping' ? 'Free shipping' : `$${Number(c.value).toFixed(2)}`} • {c.min_order_value ? `Min $${c.min_order_value}` : 'No min'}{c.free_shipping ? ' • Free shipping' : ''}{c.max_uses ? ` • Used ${c.used_count || 0} / ${c.max_uses}` : ` • Used ${c.used_count || 0}`}{c.max_per_user ? ` • Max per user ${c.max_per_user}` : ''}{c.one_per_user ? ' • One per user' : ''}{c.first_order_only ? ' • First order only' : ''}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleToggle(c.id)} className={`text-xs px-3 py-1.5 rounded-lg ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{c.is_active ? 'Active' : 'Inactive'}</button>
                <button onClick={() => handleEdit(c)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg">Edit</button>
                <button onClick={() => handleDelete(c.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
