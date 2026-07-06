import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const categories = ['men', 'women', 'kids', 'footwear', 'jewelry', 'accessories', 'sportswear', 'beauty'];

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sort, setSort] = useState('');

  const fetchProducts = () => {
    api.get('/products?limit=100').then(res => setProducts(res.data.products)).finally(() => setLoading(false));
  };
  useEffect(fetchProducts, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Delete failed'); }
  };

  const filtered = products
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !categoryFilter || p.category === categoryFilter)
    .filter(p => {
      if (stockFilter === 'instock') return p.stock > 20;
      if (stockFilter === 'low') return p.stock > 0 && p.stock <= 20;
      if (stockFilter === 'out') return p.stock === 0;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'stock_asc') return a.stock - b.stock;
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const hasFilters = search || categoryFilter || stockFilter || sort;

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <Link to="/admin/products/new" className="bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-700">+ Add Product</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400 w-48" />

        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>

        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400">
          <option value="">All Stock</option>
          <option value="instock">In Stock (&gt;20)</option>
          <option value="low">Low Stock (1–20)</option>
          <option value="out">Out of Stock</option>
        </select>

        <select value={sort} onChange={e => setSort(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400">
          <option value="">Sort: Default</option>
          <option value="name">Name A–Z</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="stock_asc">Stock: Low First</option>
          <option value="rating">Top Rated</option>
        </select>

        {hasFilters && <button onClick={() => { setSearch(''); setCategoryFilter(''); setStockFilter(''); setSort(''); }} className="text-xs text-red-500 hover:underline px-2">Clear</button>}
        <span className="text-xs text-gray-400 self-center ml-auto">{filtered.length} of {products.length} products</span>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Sub-Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Returns</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 flex items-center gap-3">
                  <img src={p.images?.[0] || 'https://via.placeholder.com/40'} alt={p.name} className="w-10 h-10 object-cover rounded" />
                  <span className="font-medium max-w-[160px] truncate">{p.name}</span>
                </td>
                <td className="px-4 py-3 capitalize">{p.category}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.sub_category || '—'}</td>
                <td className="px-4 py-3">
                  ${Number(p.price).toFixed(2)}
                  {p.original_price && Number(p.original_price) > Number(p.price) && (
                    <span className="ml-2 text-xs text-gray-400 line-through">${Number(p.original_price).toFixed(2)}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.stock > 20 ? 'bg-green-100 text-green-700' : p.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-yellow-400 text-xs">{'★'.repeat(Math.round(p.rating || 0))}</span>
                  <span className="text-gray-400 text-xs ml-1">({p.num_reviews})</span>
                </td>
                <td className="px-4 py-3">
                  {p.is_returnable === true
                    ? <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">↩ {p.return_window_days ?? 7}d</span>
                    : <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">🚫 No</span>}
                </td>
                <td className="px-4 py-3">
                  {p.seller_id === user?.id ? (
                    <div className="flex gap-2">
                      <Link to={`/admin/products/${p.id}/edit`} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-200">Edit</Link>
                      <button onClick={() => handleDelete(p.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs hover:bg-red-200">Delete</button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Not yours</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-10">No products match your filters.</p>}
      </div>
    </div>
  );
}
