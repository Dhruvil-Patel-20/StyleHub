import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export default function Footer() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    toast.success('Thanks for subscribing!');
    setEmail('');
  };

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      {/* Newsletter */}
      <div className="border-b border-gray-700 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-white text-xl font-bold mb-1">Sign Up To Receive Our Updates</h3>
            <p className="text-gray-400 text-sm">Be the first to know about latest offers and discounts on StyleHub</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-3 w-full md:w-auto">
            <input
              type="email" required placeholder="Enter your Email Address"
              value={email} onChange={e => setEmail(e.target.value)}
              className="flex-1 md:w-72 px-4 py-2 rounded-full text-sm text-gray-900 focus:outline-none"
            />
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 text-sm font-medium whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="text-white font-bold text-lg mb-3 hover:text-indigo-400 inline-block">StyleHub</Link>
          <p className="text-sm mt-1">Your one-stop fashion destination for men, women, kids, footwear & jewelry.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Shop</h4>
          {['men', 'women', 'kids', 'footwear', 'jewelry'].map(c => (
            <Link key={c} to={`/products?category=${c}`} className="block capitalize text-sm hover:text-white mb-1">{c}</Link>
          ))}
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Account</h4>
          <Link to="/profile" className="block text-sm hover:text-white mb-1">Profile</Link>
          <Link to="/orders" className="block text-sm hover:text-white mb-1">Orders</Link>
          <Link to="/wishlist" className="block text-sm hover:text-white mb-1">Wishlist</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="block text-sm hover:text-white mb-1">Admin Panel</Link>
          )}
          {user?.role === 'seller' && (
            <Link to="/seller" className="block text-sm hover:text-white mb-1">Seller Dashboard</Link>
          )}
          {!user && (
            <Link to="/login" className="block text-sm hover:text-white mb-1">Login / Register</Link>
          )}
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Help</h4>
          <Link to="/shipping" className="block text-sm hover:text-white mb-1">Shipping & Delivery</Link>
          <Link to="/returns" className="block text-sm hover:text-white mb-1">Return Policy</Link>
          <Link to="/how-to-care" className="block text-sm hover:text-white mb-1">How to Care</Link>
          <Link to="/terms" className="block text-sm hover:text-white mb-1">Terms of Service</Link>
          <Link to="/privacy" className="block text-sm hover:text-white mb-1">Privacy Policy</Link>
          <Link to="/contact" className="block text-sm hover:text-white mb-1">Contact Us</Link>
        </div>
      </div>
      <div className="text-center text-sm py-4 border-t border-gray-700">© {new Date().getFullYear()} StyleHub. All rights reserved.</div>
    </footer>
  );
}
