import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const emptyForm = { name: '', description: '', price: '', original_price: '', category: 'men', subCategory: '', sizes: '', colors: '', stock: '', featured: false, is_returnable: true, return_window_days: '7', return_policy_note: '' };

export default function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isSeller = window.location.pathname.startsWith('/seller');
  const backPath = isSeller ? '/seller' : '/admin/products';
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(id);

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`).then(res => {
        const p = res.data;
        setForm({ name: p.name, description: p.description, price: p.price, original_price: p.original_price || '', category: p.category, subCategory: p.sub_category || '', sizes: p.sizes?.join(',') || '', colors: p.colors?.join(',') || '', stock: p.stock, featured: p.featured, is_returnable: p.is_returnable !== false, return_window_days: p.return_window_days ?? 7, return_policy_note: p.return_policy_note || '' });
      });
    }
  }, [id, isEdit]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      images.forEach(img => data.append('images', img));
      const validUrls = imageUrls.filter(u => u.trim());
      if (validUrls.length) data.append('imageUrls', JSON.stringify(validUrls));
      if (isEdit) await api.put(`/products/${id}`, data);
      else await api.post('/products', data);
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
      navigate(backPath);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-8 space-y-4">
        <input name="name" placeholder="Product Name" required value={form.name} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" />
        <textarea name="description" placeholder="Description" required value={form.description} onChange={handleChange} rows={3} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Selling Price <span className="text-red-500">*</span></label>
            <input name="price" type="number" step="0.01" placeholder="e.g. 29.99" required value={form.price} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Stock <span className="text-red-500">*</span></label>
            <input name="stock" type="number" placeholder="e.g. 100" required value={form.stock} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Original Price (MRP) — leave blank if no discount</label>
          <input name="original_price" type="number" step="0.01" placeholder="e.g. 49.99" value={form.original_price} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" />
          {form.original_price && form.price && Number(form.original_price) > Number(form.price) && (
            <p className="text-green-600 text-sm mt-1 font-medium">
              🏷️ {Math.round((1 - Number(form.price) / Number(form.original_price)) * 100)}% off — customers see <span className="line-through text-gray-400">${Number(form.original_price).toFixed(2)}</span> crossed out
            </p>
          )}
          {form.original_price && form.price && Number(form.original_price) <= Number(form.price) && (
            <p className="text-red-500 text-xs mt-1">Original price must be higher than selling price.</p>
          )}
        </div>
        <select name="category" value={form.category} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500">
          {['men', 'women', 'kids', 'footwear', 'jewelry', 'accessories', 'sportswear', 'beauty'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <input name="subCategory" placeholder="Sub-category (e.g. T-Shirts, Sneakers)" value={form.subCategory} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" />
        <input name="sizes" placeholder="Sizes (comma-separated: S,M,L,XL)" value={form.sizes} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" />
        <input name="colors" placeholder="Colors (comma-separated: Red,Blue,Black)" value={form.colors} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" />
        <div className="flex items-center gap-2">
          <input type="checkbox" name="featured" id="featured" checked={form.featured} onChange={handleChange} />
          <label htmlFor="featured" className="text-sm text-gray-700">Mark as Featured</label>
        </div>

        {/* Return Policy */}
        <div className="border rounded-xl p-4 space-y-3 bg-gray-50">
          <p className="font-medium text-sm text-gray-700">Return Policy</p>
          <div className="flex items-center gap-3">
            <button type="button"
              onClick={() => setForm(f => ({ ...f, is_returnable: !f.is_returnable }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.is_returnable ? 'bg-indigo-600' : 'bg-gray-300'
              }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.is_returnable ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className="text-sm text-gray-700">
              {form.is_returnable ? '✅ Returnable' : '❌ Non-Returnable'}
            </span>
          </div>
          {form.is_returnable && (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Return Window (days)</label>
                <input name="return_window_days" type="number" min="1" max="365" value={form.return_window_days} onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Return Policy Note (optional)</label>
                <input name="return_policy_note" placeholder="e.g. Item must be unused and in original packaging"
                  value={form.return_policy_note} onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            </>
          )}
          {!form.is_returnable && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Reason (optional)</label>
              <input name="return_policy_note" placeholder="e.g. Perishable item / Customized product"
                value={form.return_policy_note} onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          )}
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">Product Images (File Upload)</label>
          <input type="file" multiple accept="image/*" onChange={e => setImages(Array.from(e.target.files))} className="text-sm" />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">Product Images (URL)</label>
          {imageUrls.map((url, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={url}
                onChange={e => setImageUrls(prev => prev.map((u, idx) => idx === i ? e.target.value : u))}
                className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
              {imageUrls.length > 1 && (
                <button type="button" onClick={() => setImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-red-500 hover:text-red-700 text-lg px-2">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setImageUrls(prev => [...prev, ''])}
            className="text-sm text-indigo-600 hover:underline">+ Add another URL</button>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-full hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
