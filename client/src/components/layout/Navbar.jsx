import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const NAV_CATEGORIES = [
  { name: 'Men', slug: 'men', subs: ['Shirts', 'Pants', 'Hoodies', 'Jackets', 'Suits'] },
  { name: 'Women', slug: 'women', subs: ['Dresses', 'Jeans', 'Jackets', 'Tops', 'Skirts'] },
  { name: 'Kids', slug: 'kids', subs: ['T-Shirts', 'Bottoms', 'Jackets', 'Dresses'] },
  { name: 'Footwear', slug: 'footwear', subs: ['Sneakers', 'Boots', 'Running', 'Sandals'] },
  { name: 'Jewelry', slug: 'jewelry', subs: ['Earrings', 'Necklaces', 'Bracelets', 'Rings', 'Luxury Watches'] },
  { name: 'Accessories', slug: 'accessories', subs: ['Wallets', 'Bags', 'Sunglasses', 'Belts', 'Smart Watches'] },
  { name: 'Sportswear', slug: 'sportswear', subs: ['T-Shirts', 'Leggings', 'Jackets', 'Shorts'] },
  { name: 'Beauty', slug: 'beauty', subs: ['Skincare', 'Makeup', 'Fragrance', 'Haircare'] },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const closeTimer = useRef(null);

  const location = useLocation();
  const isHome = location.pathname === '/';

  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const openDropdown = (slug) => {
    clearTimeout(closeTimer.current);
    setActiveDropdown(slug);
  };
  const closeDropdown = () => {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">

      {/* Row 1: Logo + Search + Icons */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="text-2xl font-bold text-indigo-600 shrink-0">StyleHub</Link>

        <form onSubmit={handleSearch} className="hidden md:flex items-center border rounded-full px-3 py-1.5 w-72 bg-gray-50">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="outline-none text-sm bg-transparent w-full"
          />
          <button type="submit" className="text-gray-400 hover:text-indigo-600 ml-1">🔍</button>
        </form>

        {/* Right icons */}
        <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
          <Link to="/wishlist" className="text-gray-600 hover:text-indigo-600 text-xl">♡</Link>
          <Link to="/cart" className="relative text-gray-600 hover:text-indigo-600">
            🛒
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(prev => prev === 'user' ? false : 'user')}
                className="flex items-center gap-2 hover:opacity-80 transition">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              </button>
              {menuOpen === 'user' && (
                <div className="absolute right-0 mt-1 w-48 bg-white shadow-lg rounded z-50 border border-gray-100">
                  {user.role === 'seller' && (
                    <Link to="/seller" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100 font-medium text-indigo-600 border-b">Seller Dashboard</Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100 font-medium text-indigo-600 border-b">Admin Panel</Link>
                  )}
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100">Profile</Link>
                  <Link to="/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100">My Orders</Link>
                  <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100">Wishlist</Link>
                  <button onClick={() => { logout(); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-500 border-t">Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="text-sm font-medium text-indigo-600 hover:underline">Login</Link>
          )}
          <button className="md:hidden" onClick={() => setMenuOpen(prev => prev === 'mobile' ? false : 'mobile')}>☰</button>
        </div>
      </div>


      {/* Row 2: Category dropdowns — homepage only */}
      {isHome && <div className="hidden md:block border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center">
          {NAV_CATEGORIES.map((cat, i) => (
            <div
              key={cat.slug}
              className="relative"
              onMouseEnter={() => openDropdown(cat.slug)}
              onMouseLeave={closeDropdown}
            >
              <Link
                to={`/products?category=${cat.slug}`}
                className="capitalize text-sm text-gray-600 hover:text-indigo-600 font-medium px-4 py-1 flex items-center gap-1"
              >
                {cat.name}
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>

              {activeDropdown === cat.slug && (
                <div
                  className="absolute top-full left-0 mt-0 w-44 bg-white shadow-xl rounded-lg border border-gray-100 z-50 py-1"
                  onMouseEnter={() => openDropdown(cat.slug)}
                  onMouseLeave={closeDropdown}
                >
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="block px-4 py-2 text-sm text-indigo-600 font-semibold hover:bg-indigo-50 border-b border-gray-100"
                    onClick={() => setActiveDropdown(null)}
                  >
                    All {cat.name}
                  </Link>
                  {cat.subs.map(sub => (
                    <Link
                      key={sub}
                      to={`/products?category=${cat.slug}&subCategory=${encodeURIComponent(sub)}`}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              )}

              {i < NAV_CATEGORIES.length - 1 && <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-200">|</span>}
            </div>
          ))}
        </div>
      </div>}

      {/* Mobile menu */}
      {menuOpen === 'mobile' && (
        <div className="md:hidden px-4 pb-3 flex flex-col gap-1 border-t border-gray-100 max-h-[80vh] overflow-y-auto">
          <form onSubmit={(e) => { handleSearch(e); setMenuOpen(false); }} className="flex items-center border rounded-full px-3 py-1.5 mt-2 mb-2 bg-gray-50">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="outline-none text-sm bg-transparent w-full" />
            <button type="submit" className="text-gray-400">🔍</button>
          </form>

          {/* Mobile category links — homepage only */}
          {isHome && NAV_CATEGORIES.map(cat => (
            <div key={cat.slug}>
              <Link to={`/products?category=${cat.slug}`} onClick={() => setMenuOpen(false)}
                className="block text-sm font-semibold text-gray-700 hover:text-indigo-600 py-1 capitalize">
                {cat.name}
              </Link>
              <div className="pl-3 flex flex-col gap-0.5 mb-1">
                {cat.subs.map(sub => (
                  <Link key={sub} to={`/products?category=${cat.slug}&subCategory=${encodeURIComponent(sub)}`}
                    onClick={() => setMenuOpen(false)}
                    className="text-xs text-gray-500 hover:text-indigo-600 py-0.5">
                    {sub}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}
