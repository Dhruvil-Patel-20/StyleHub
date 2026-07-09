import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const empty = {
  title: '', subtitle: '', image_url: '', discount_text: '', coupon_code: '',
  redirect_url: '/products', start_date: '', end_date: '',
  is_active: true, bg_color: '#4F46E5', text_color: '#ffffff',
};

function BannerPreview({ b }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden h-48 flex items-center"
      style={{ background: b.image_url ? 'transparent' : b.bg_color || '#4F46E5' }}
    >
      {b.image_url && (
        <img src={b.image_url} alt={b.title} className="absolute inset-0 w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
      )}
      <div className="absolute inset-0" style={{ background: b.image_url ? 'rgba(0,0,0,0.45)' : 'transparent' }} />
      <div className="relative z-10 px-8 flex flex-col gap-2" style={{ color: b.image_url ? '#fff' : (b.text_color || '#fff') }}>
        {b.discount_text && (
          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-white bg-opacity-20 border border-white border-opacity-30 w-fit">
            {b.discount_text}
          </span>
        )}
        <h2 className="text-2xl font-extrabold leading-tight">{b.title || 'Banner Title'}</h2>
        {b.subtitle && <p className="text-sm opacity-90">{b.subtitle}</p>}
        {b.coupon_code && (
          <p className="text-sm">
            Use code <span className="font-bold px-2 py-0.5 rounded bg-white bg-opacity-20">{b.coupon_code}</span>
          </p>
        )}
        <a href={b.redirect_url || '/products'} className="mt-1 inline-block text-xs font-semibold px-4 py-1.5 rounded-full bg-white bg-opacity-20 border border-white border-opacity-40 w-fit hover:bg-opacity-30 transition">
          Shop Now →
        </a>
      </div>
    </div>
  );
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    try {
      const { data } = await api.get('/banners/all');
      setBanners(data);
    } catch { toast.error('Failed to load banners'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { data } = await api.put(`/banners/${editId}`, form);
        setBanners(prev => prev.map(b => b.id === editId ? data : b));
        toast.success('Banner updated');
      } else {
        const { data } = await api.post('/banners', form);
        setBanners(prev => [data, ...prev]);
        toast.success('Banner created');
      }
      setForm(empty); setEditId(null); setShowForm(false);
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to save banner'); }
  };

  const handleEdit = (b) => {
    setForm({
      title: b.title || '', subtitle: b.subtitle || '', image_url: b.image_url || '',
      discount_text: b.discount_text || '', coupon_code: b.coupon_code || '',
      redirect_url: b.redirect_url || '/products',
      start_date: b.start_date ? b.start_date.slice(0, 16) : '',
      end_date: b.end_date ? b.end_date.slice(0, 16) : '',
      is_active: b.is_active, bg_color: b.bg_color || '#4F46E5', text_color: b.text_color || '#ffffff',
    });
    setEditId(b.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await api.patch(`/banners/${id}/toggle`);
      setBanners(prev => prev.map(b => b.id === id ? data : b));
      toast.success(`Banner ${data.is_active ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to toggle banner'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await api.delete(`/banners/${id}`);
      setBanners(prev => prev.filter(b => b.id !== id));
      toast.success('Banner deleted');
    } catch { toast.error('Failed to delete banner'); }
  };

  const now = new Date();
  const getStatus = (b) => {
    if (!b.is_active) return { label: 'Inactive', color: 'bg-gray-100 text-gray-500' };
    const start = new Date(b.start_date), end = new Date(b.end_date);
    if (now < start) return { label: 'Scheduled', color: 'bg-yellow-100 text-yellow-700' };
    if (now > end) return { label: 'Expired', color: 'bg-red-100 text-red-600' };
    return { label: 'Live', color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Banner Offers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage promotional banners shown on the homepage</p>
        </div>
        <button
          onClick={() => { setForm(empty); setEditId(null); setShowForm(s => !s); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          {showForm && !editId ? 'Cancel' : '+ New Banner'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow p-6 mb-8 border border-indigo-100">
          <h2 className="font-semibold text-gray-800 mb-4">{editId ? 'Edit Banner' : 'Create Banner'}</h2>

          {/* Live Preview */}
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Live Preview</p>
            <BannerPreview b={form} />
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Title *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-400" placeholder="e.g. Summer Sale — Up to 50% Off" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Subtitle</label>
              <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-400" placeholder="e.g. Free shipping on orders over $50" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Banner Image URL</label>
              <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-400" placeholder="https://... (leave empty to use background color)" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Discount Text</label>
              <input value={form.discount_text} onChange={e => setForm(f => ({ ...f, discount_text: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-400" placeholder="e.g. 50% OFF" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Coupon Code</label>
              <input value={form.coupon_code} onChange={e => setForm(f => ({ ...f, coupon_code: e.target.value.toUpperCase() }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-400 font-mono" placeholder="e.g. SUMMER50" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Redirect URL</label>
              <input value={form.redirect_url} onChange={e => setForm(f => ({ ...f, redirect_url: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-400" placeholder="/products" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Background Color (no image)</label>
              <div className="flex gap-2 mt-1 items-center">
                <input type="color" value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} className="h-9 w-12 rounded border cursor-pointer" />
                <input value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 font-mono" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Text Color</label>
              <div className="flex gap-2 mt-1 items-center">
                <input type="color" value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} className="h-9 w-12 rounded border cursor-pointer" />
                <input value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 font-mono" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Start Date *</label>
              <input required type="datetime-local" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">End Date *</label>
              <input required type="datetime-local" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
              <label htmlFor="is_active" className="text-sm text-gray-700">Active (show on homepage when within date range)</label>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
                {editId ? 'Update Banner' : 'Create Banner'}
              </button>
              <button type="button" onClick={() => { setForm(empty); setEditId(null); setShowForm(false); }}
                className="border border-gray-300 text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-50 text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎨</p>
          <p>No banners yet. Create your first banner offer.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map(b => {
            const status = getStatus(b);
            return (
              <div key={b.id} className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
                {/* Preview row */}
                {previewOpen === b.id && (
                  <div className="p-4 border-b bg-gray-50">
                    <BannerPreview b={b} />
                  </div>
                )}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: b.image_url ? '#f3f4f6' : (b.bg_color || '#4F46E5') }}>
                    {b.image_url
                      ? <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                      : <span className="text-white text-xs font-bold px-1 text-center">{b.title?.slice(0, 12)}</span>
                    }
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 truncate">{b.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
                      {b.coupon_code && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-mono">{b.coupon_code}</span>}
                      {b.discount_text && <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">{b.discount_text}</span>}
                    </div>
                    {b.subtitle && <p className="text-sm text-gray-500 truncate mt-0.5">{b.subtitle}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(b.start_date).toLocaleDateString()} → {new Date(b.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <button onClick={() => setPreviewOpen(previewOpen === b.id ? null : b.id)}
                      className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                      {previewOpen === b.id ? 'Hide' : 'Preview'}
                    </button>
                    <button onClick={() => handleToggle(b.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium ${b.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {b.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button onClick={() => handleEdit(b)}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(b.id)}
                      className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
