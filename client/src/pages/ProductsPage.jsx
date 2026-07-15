import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/product/ProductCard';

const categories = ['men', 'women', 'kids', 'footwear', 'jewelry', 'accessories', 'sportswear', 'beauty'];
const sortOptions = [
  { label: 'Newest', value: '' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
];
const subCategories = {
  men: ['Shirts', 'Pants', 'Hoodies', 'Jackets', 'Suits'],
  women: ['Dresses', 'Jeans', 'Jackets', 'Tops', 'Skirts'],
  kids: ['T-Shirts', 'Bottoms', 'Jackets', 'Dresses'],
  footwear: ['Sneakers', 'Boots', 'Running', 'Sandals'],
  jewelry: ['Earrings', 'Necklaces', 'Bracelets', 'Rings', 'Luxury Watches'],
  accessories: ['Wallets', 'Bags', 'Sunglasses', 'Belts', 'Smart Watches'],
  sportswear: ['T-Shirts', 'Leggings', 'Jackets', 'Shorts'],
  beauty: ['Skincare', 'Makeup', 'Fragrance', 'Haircare'],
};
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '6', '7', '8', '9', '10', '11'];
const ALL_COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Gray', 'Brown', 'Navy', 'Beige', 'Purple'];
const COLOR_MAP = { Black: '#111', White: '#fff', Red: '#ef4444', Blue: '#3b82f6', Green: '#22c55e', Yellow: '#eab308', Pink: '#ec4899', Gray: '#9ca3af', Brown: '#92400e', Navy: '#1e3a5f', Beige: '#d4b896', Purple: '#a855f7' };
const PRICE_RANGES = [
  { label: 'Under $25', min: '', max: '25' },
  { label: '$25 – $50', min: '25', max: '50' },
  { label: '$50 – $100', min: '50', max: '100' },
  { label: '$100 – $200', min: '100', max: '200' },
  { label: 'Over $200', min: '200', max: '' },
];

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button onClick={() => setOpen(o => !o)} className="flex items-center justify-between w-full mb-3">
        <span className="font-semibold text-gray-700 text-sm">{title}</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && children}
    </div>
  );
}

function Sidebar({ searchParams, setSearchParams, priceMin, setPriceMin, priceMax, setPriceMax, activeFiltersCount, clearAll, sellers = [] }) {
  const category    = searchParams.get('category') || '';
  const subCategory = searchParams.get('subCategory') || '';
  const minPrice    = searchParams.get('minPrice') || '';
  const maxPrice    = searchParams.get('maxPrice') || '';
  const minRating   = searchParams.get('minRating') || '';
  const size        = searchParams.get('size') || '';
  const color       = searchParams.get('color') || '';
  const inStock     = searchParams.get('inStock') || '';
  const onSale      = searchParams.get('onSale') || '';
  const sellerId    = searchParams.get('sellerId') || '';

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const applyPriceRange = (min, max) => {
    const p = new URLSearchParams(searchParams);
    if (min) p.set('minPrice', min); else p.delete('minPrice');
    if (max) p.set('maxPrice', max); else p.delete('maxPrice');
    p.delete('page');
    setPriceMin(min); setPriceMax(max);
    setSearchParams(p);
  };

  const selectedPriceRange = PRICE_RANGES.find(r => r.min === minPrice && r.max === maxPrice);

  return (
    <aside className="w-full md:w-60 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-base">Filters</h3>
        {activeFiltersCount > 0 && (
          <button onClick={clearAll} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
            Clear all <span className="bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0.5 font-semibold">{activeFiltersCount}</span>
          </button>
        )}
      </div>

      <Section title="Category">
        <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('category'); p.delete('subCategory'); p.delete('page'); setSearchParams(p); }}
          className={`block w-full text-left px-3 py-1.5 rounded mb-0.5 text-sm ${!category ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}`}>All</button>
        {categories.map(c => (
          <button key={c} onClick={() => { const p = new URLSearchParams(searchParams); p.set('category', c); p.delete('subCategory'); p.delete('page'); setSearchParams(p); }}
            className={`block w-full text-left px-3 py-1.5 rounded mb-0.5 text-sm capitalize ${category === c ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}`}>
            {c}
          </button>
        ))}
      </Section>

      <Section title="Seller">
        <select
          value={sellerId}
          onChange={e => setParam('sellerId', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-indigo-400"
        >
          <option value="">All Sellers</option>
          {sellers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </Section>

      {category && subCategories[category] && (
        <Section title="Sub-Category">
          <button onClick={() => setParam('subCategory', '')}
            className={`block w-full text-left px-3 py-1.5 rounded mb-0.5 text-sm ${!subCategory ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-100'}`}>
            All {category}
          </button>
          {subCategories[category].map(s => (
            <button key={s} onClick={() => setParam('subCategory', s)}
              className={`block w-full text-left px-3 py-1.5 rounded mb-0.5 text-sm ${subCategory === s ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-100'}`}>
              {s}
            </button>
          ))}
        </Section>
      )}

      <Section title="Price Range">
        <div className="space-y-1 mb-3">
          {PRICE_RANGES.map(r => (
            <button key={r.label} onClick={() => applyPriceRange(r.min, r.max)}
              className={`block w-full text-left px-3 py-1.5 rounded text-sm ${selectedPriceRange?.label === r.label ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-100'}`}>
              {r.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-2">Custom range</p>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm outline-none focus:border-indigo-400" />
          <span className="text-gray-400 text-xs">–</span>
          <input type="number" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm outline-none focus:border-indigo-400" />
        </div>
        <button onClick={() => applyPriceRange(priceMin, priceMax)}
          className="mt-2 w-full bg-indigo-600 text-white text-xs py-1.5 rounded hover:bg-indigo-700 transition">
          Apply
        </button>
      </Section>

      <Section title="Min. Rating">
        {[4, 3, 2, 1].map(r => (
          <button key={r} onClick={() => setParam('minRating', minRating === String(r) ? '' : String(r))}
            className={`flex items-center gap-2 w-full px-3 py-1.5 rounded text-sm mb-0.5 ${minRating === String(r) ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-100'}`}>
            <span className="text-yellow-400">{'★'.repeat(r)}<span className="text-gray-300">{'★'.repeat(5 - r)}</span></span>
            <span className="text-xs text-gray-500">& up</span>
          </button>
        ))}
      </Section>

      <Section title="Size">
        <div className="flex flex-wrap gap-1.5">
          {ALL_SIZES.map(s => (
            <button key={s} onClick={() => setParam('size', size === s ? '' : s)}
              className={`px-2.5 py-1 rounded border text-xs font-medium transition ${size === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 hover:border-indigo-400 hover:text-indigo-600'}`}>
              {s}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Color">
        <div className="flex flex-wrap gap-2">
          {ALL_COLORS.map(c => (
            <button key={c} onClick={() => setParam('color', color === c ? '' : c)}
              title={c}
              className={`w-6 h-6 rounded-full border-2 transition ${color === c ? 'border-indigo-600 scale-110' : 'border-gray-300 hover:border-indigo-400'}`}
              style={{ backgroundColor: COLOR_MAP[c] }} />
          ))}
        </div>
        {color && <p className="text-xs text-indigo-600 mt-2 font-medium">{color} selected</p>}
      </Section>

      <Section title="Availability & Deals">
        <label className="flex items-center gap-2 px-1 py-1.5 cursor-pointer hover:bg-gray-50 rounded">
          <input type="checkbox" checked={inStock === 'true'} onChange={e => setParam('inStock', e.target.checked ? 'true' : '')} className="accent-indigo-600" />
          <span className="text-sm text-gray-700">In Stock Only</span>
        </label>
        <label className="flex items-center gap-2 px-1 py-1.5 cursor-pointer hover:bg-gray-50 rounded">
          <input type="checkbox" checked={!!onSale} onChange={e => setParam('onSale', e.target.checked ? 'true' : '')} className="accent-indigo-600" />
          <span className="text-sm text-gray-700">On Sale</span>
        </label>
      </Section>
    </aside>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [priceMin, setPriceMin] = useState(searchParams.get('minPrice') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('maxPrice') || '');
  const [sellers, setSellers] = useState([]);

  const category    = searchParams.get('category') || '';
  const subCategory = searchParams.get('subCategory') || '';
  const search      = searchParams.get('search') || '';
  const sort        = searchParams.get('sort') || '';
  const page        = Number(searchParams.get('page') || 1);
  const minPrice    = searchParams.get('minPrice') || '';
  const maxPrice    = searchParams.get('maxPrice') || '';
  const minRating   = searchParams.get('minRating') || '';
  const size        = searchParams.get('size') || '';
  const color       = searchParams.get('color') || '';
  const inStock     = searchParams.get('inStock') || '';
  const onSale      = searchParams.get('onSale') || '';
  const sellerId    = searchParams.get('sellerId') || '';

  useEffect(() => {
    api.get('/products/sellers')
      .then(res => setSellers(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category)    params.set('category', category);
    if (subCategory) params.set('subCategory', subCategory);
    if (search)      params.set('search', search);
    if (sort)        params.set('sort', sort);
    if (minPrice)    params.set('minPrice', minPrice);
    if (maxPrice)    params.set('maxPrice', maxPrice);
    if (minRating)   params.set('minRating', minRating);
    if (size)        params.set('size', size);
    if (color)       params.set('color', color);
    if (inStock)     params.set('inStock', inStock);
    if (sellerId)    params.set('sellerId', sellerId);
    params.set('page', page);
    api.get(`/products?${params}`)
      .then(res => { setAllProducts(res.data.products); setTotal(res.data.total); setPages(res.data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, subCategory, search, sort, minPrice, maxPrice, minRating, size, color, inStock, sellerId, page]);

  // onSale is client-side only (products with original_price > price)
  const products = onSale
    ? allProducts.filter(p => p.original_price && Number(p.original_price) > Number(p.price))
    : allProducts;

  const setParam = useCallback((key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  }, [searchParams, setSearchParams]);

  const activeFiltersCount = [minPrice, maxPrice, minRating, size, color, inStock, onSale, subCategory, sellerId].filter(Boolean).length;

  const clearAll = useCallback(() => {
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    if (search) p.set('search', search);
    setPriceMin(''); setPriceMax('');
    setSearchParams(p);
  }, [category, search, setSearchParams]);

  const sidebarProps = { searchParams, setSearchParams, priceMin, setPriceMin, priceMax, setPriceMax, activeFiltersCount, clearAll, sellers };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Mobile filter toggle */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{total} products found</p>
        <button onClick={() => setSidebarOpen(o => !o)}
          className="flex items-center gap-2 border rounded-full px-4 py-1.5 text-sm font-medium hover:bg-gray-50">
          ⚙ Filters {activeFiltersCount > 0 && <span className="bg-indigo-600 text-white rounded-full px-1.5 text-xs">{activeFiltersCount}</span>}
        </button>
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="bg-white w-72 h-full overflow-y-auto p-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-800">Filters</span>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <Sidebar {...sidebarProps} />
          </div>
          <div className="flex-1 bg-black bg-opacity-40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="hidden md:block sticky top-[57px] self-start" style={{height: 'calc(100vh - 57px)'}}>
          <div className="h-full overflow-y-auto pr-2 w-60">
            <Sidebar {...sidebarProps} />
          </div>
        </div>

        <div className="flex-1">
          {/* Active filter chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {minPrice && <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">Min ${minPrice} <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('minPrice'); p.delete('page'); setPriceMin(''); setSearchParams(p); }} className="hover:text-red-500">✕</button></span>}
              {maxPrice && <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">Max ${maxPrice} <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('maxPrice'); p.delete('page'); setPriceMax(''); setSearchParams(p); }} className="hover:text-red-500">✕</button></span>}
              {minRating && <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">{'★'.repeat(Number(minRating))}+ <button onClick={() => setParam('minRating', '')} className="hover:text-red-500">✕</button></span>}
              {size && <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">Size: {size} <button onClick={() => setParam('size', '')} className="hover:text-red-500">✕</button></span>}
              {color && <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">Color: {color} <button onClick={() => setParam('color', '')} className="hover:text-red-500">✕</button></span>}
              {inStock && <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">In Stock <button onClick={() => setParam('inStock', '')} className="hover:text-red-500">✕</button></span>}
              {onSale && <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">On Sale <button onClick={() => setParam('onSale', '')} className="hover:text-red-500">✕</button></span>}
              {subCategory && <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">{subCategory} <button onClick={() => setParam('subCategory', '')} className="hover:text-red-500">✕</button></span>}
              {sellerId && sellers.find(s => s.id === sellerId) && <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">Seller: {sellers.find(s => s.id === sellerId)?.name} <button onClick={() => setParam('sellerId', '')} className="hover:text-red-500">✕</button></span>}
            </div>
          )}

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setParam('search', e.target.value)}
                placeholder="Search products or sellers"
                className="w-full md:max-w-md border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="hidden md:block text-sm text-gray-500">{onSale ? products.length : total} products found</p>
              <select value={sort} onChange={e => setParam('sort', e.target.value)} className="border rounded px-3 py-1.5 text-sm ml-auto">
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-medium text-gray-600">No products found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
              {activeFiltersCount > 0 && <button onClick={clearAll} className="mt-4 text-indigo-600 text-sm hover:underline">Clear all filters</button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {pages > 1 && !onSale && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => { const sp = new URLSearchParams(searchParams); sp.set('page', p); setSearchParams(sp); }}
                  className={`w-9 h-9 rounded-full text-sm ${page === p ? 'bg-indigo-600 text-white' : 'border hover:bg-gray-100'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
