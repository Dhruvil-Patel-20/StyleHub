import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/product/ProductCard';

const categories = ['men', 'women', 'kids', 'footwear', 'jewelry', 'accessories', 'sportswear', 'beauty'];

export default function WishlistPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [minRating, setMinRating] = useState('');

  useEffect(() => {
    if (user?.wishlist?.length) {
      Promise.allSettled(user.wishlist.map(id => api.get(`/products/${id}`)))
        .then(results => setProducts(
          results.filter(r => r.status === 'fulfilled').map(r => r.value.data)
        ));
    } else {
      setProducts([]);
    }
  }, [user]);

  const filtered = products
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !category || p.category === category)
    .filter(p => !minRating || p.rating >= Number(minRating))
    .sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'rating') return b.rating - a.rating;
      return 0;
    });

  const hasFilters = search || category || sort || minRating;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Wishlist <span className="text-gray-400 text-lg font-normal">({products.length})</span></h1>
      </div>

      {products.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search wishlist..."
            className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400 w-48"
          />
          <select value={category} onChange={e => setCategory(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <select value={minRating} onChange={e => setMinRating(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400">
            <option value="">Any Rating</option>
            <option value="4">4★ & up</option>
            <option value="3">3★ & up</option>
            <option value="2">2★ & up</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400">
            <option value="">Sort: Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setCategory(''); setSort(''); setMinRating(''); }}
              className="text-xs text-red-500 hover:underline px-2">Clear</button>
          )}
          <span className="text-xs text-gray-400 self-center ml-auto">{filtered.length} of {products.length} items</span>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💝</p>
          <p>Your wishlist is empty.</p>
          <Link to="/products" className="text-indigo-600 hover:underline mt-2 block">Browse Products</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-3">🔍</p>
          <p>No items match your filters.</p>
          <button onClick={() => { setSearch(''); setCategory(''); setSort(''); setMinRating(''); }} className="text-indigo-600 hover:underline mt-2 block mx-auto">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
