import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user, toggleWishlist, isWishlisted } = useAuth();
  const navigate = useNavigate();
  const pid = product.id || product._id;
  const hasDiscount = product.original_price && Number(product.original_price) > Number(product.price);
  const discountPct = hasDiscount ? Math.round((1 - Number(product.price) / Number(product.original_price)) * 100) : 0;
  const wishlisted = isWishlisted(pid);
  const stars = Math.min(5, Math.max(0, Math.round(Number(product.rating) || 0)));

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, 1);
    toast.success('Added to cart!');
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    const ok = await toggleWishlist(pid);
    if (ok) toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️');
  };

  return (
    <Link to={`/product/${pid}`} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative overflow-hidden bg-gray-50 flex items-center justify-center" style={{ minHeight: '220px' }}>
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/300x300?text=No+Image'}
          alt={product.name}
          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Badges — stacked top-left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.stock === 0 && (
            <span className="bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full font-medium">Out of Stock</span>
          )}
          {hasDiscount && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{discountPct}% OFF</span>
          )}
        </div>
        {product.featured && (
          <span className="absolute top-2 right-8 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">Featured</span>
        )}
        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full shadow transition-all
            ${wishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'}`}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-indigo-500 capitalize font-semibold tracking-wide">{product.category}{product.sub_category ? <span className="text-gray-400 font-normal"> · {product.sub_category}</span> : ''}</p>
        <h3 className="font-semibold text-gray-800 mt-1 truncate text-sm">{product.name}</h3>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-yellow-400 text-xs">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
          <span className="text-xs text-gray-400">({product.num_reviews ?? product.numReviews ?? 0})</span>
        </div>

        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-bold text-gray-900">${Number(product.price).toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-sm text-red-400 line-through">${Number(product.original_price).toFixed(2)}</span>
            )}
            {hasDiscount && (
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Save ${(Number(product.original_price) - Number(product.price)).toFixed(2)}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full bg-indigo-600 text-white text-sm py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  );
}
