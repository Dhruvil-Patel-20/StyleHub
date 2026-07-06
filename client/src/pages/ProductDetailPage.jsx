import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user, toggleWishlist, isWishlisted } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => { setProduct(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (product.sizes?.length && !selectedSize) return toast.error('Please select a size');
    addToCart(product, quantity, selectedSize, selectedColor);
    toast.success('Added to cart!');
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/products/${id}/review`, review);
      toast.success('Review submitted!');
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting review');
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!product) return <div className="text-center py-20 text-gray-400">Product not found.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <img src={product.images?.[selectedImage] || 'https://via.placeholder.com/500'} alt={product.name} className="w-full h-96 object-cover rounded-xl" />
          <div className="flex gap-2 mt-3">
            {product.images?.map((img, i) => (
              <img key={i} src={img} alt="" onClick={() => setSelectedImage(i)}
                className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${selectedImage === i ? 'border-indigo-600' : 'border-transparent'}`} />
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-indigo-500 capitalize text-sm font-semibold tracking-wide">
            {product.category}
            {product.sub_category && <span className="text-gray-400 font-normal"> · {product.sub_category}</span>}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">{product.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-yellow-400">{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
            <span className="text-sm text-gray-400">({product.num_reviews ?? product.numReviews} reviews)</span>
          </div>

          {/* Price block */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <span className="text-3xl font-bold text-gray-900">${Number(product.price).toFixed(2)}</span>
            {product.original_price && Number(product.original_price) > Number(product.price) && (
              <span className="text-xl text-red-400 line-through">${Number(product.original_price).toFixed(2)}</span>
            )}
            {product.original_price && Number(product.original_price) > Number(product.price) && (
              <span className="bg-red-100 text-red-600 text-sm font-bold px-3 py-1 rounded-full">
                {Math.round((1 - product.price / product.original_price) * 100)}% OFF
              </span>
            )}
          </div>
          {product.original_price && Number(product.original_price) > Number(product.price) && (
            <p className="text-green-600 text-sm font-medium mt-1">
              You save ${(Number(product.original_price) - Number(product.price)).toFixed(2)}
            </p>
          )}
          <p className="text-gray-600 mt-3">{product.description}</p>

          {product.sizes?.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-gray-700 mb-2">Size</p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className={`px-4 py-1 border rounded-full text-sm ${selectedSize === s ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:border-indigo-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors?.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-gray-700 mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)}
                    className={`px-4 py-1 border rounded-full text-sm ${selectedColor === c ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:border-indigo-400'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center border rounded-full">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-1 text-lg">-</button>
              <span className="px-4">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="px-3 py-1 text-lg">+</button>
            </div>
            <button onClick={handleAddToCart} disabled={product.stock === 0}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-full hover:bg-indigo-700 disabled:opacity-50">
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={async () => {
                if (!user) { navigate('/login'); return; }
                const ok = await toggleWishlist(product.id);
                if (ok) toast.success(isWishlisted(product.id) ? 'Removed from wishlist' : 'Added to wishlist ❤️');
              }}
              className={`w-11 h-11 flex items-center justify-center rounded-full border-2 text-xl transition-all
                ${isWishlisted(product.id) ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 text-gray-400 hover:border-red-400 hover:text-red-400'}`}
            >
              {isWishlisted(product.id) ? '♥' : '♡'}
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-3">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>

          {/* Return Policy */}
          <div className={`mt-5 rounded-xl px-4 py-3 flex items-start gap-3 ${
            product.is_returnable === true ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <span className="text-xl mt-0.5">{product.is_returnable === true ? '↩️' : '🚫'}</span>
            <div>
              <p className={`font-semibold text-sm ${product.is_returnable === true ? 'text-green-700' : 'text-red-700'}`}>
                {product.is_returnable === true
                  ? `${product.return_window_days ?? 7}-Day Easy Returns`
                  : 'Non-Returnable'}
              </p>
              <p className={`text-xs mt-0.5 ${product.is_returnable === true ? 'text-green-600' : 'text-red-500'}`}>
                {product.return_policy_note ||
                  (product.is_returnable === true
                    ? 'Return within the window for a full refund or exchange.'
                    : 'This item cannot be returned or exchanged.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Customer Reviews</h2>
        {product.reviews?.length === 0 && <p className="text-gray-400">No reviews yet.</p>}
        <div className="space-y-4 mb-8">
          {product.reviews?.map((r, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.name}</span>
                <span className="text-yellow-400 text-sm">{'★'.repeat(r.rating)}</span>
              </div>
              <p className="text-gray-600 text-sm mt-1">{r.comment}</p>
            </div>
          ))}
        </div>

        {user && (
          <form onSubmit={handleReview} className="bg-gray-50 rounded-xl p-6 max-w-lg">
            <h3 className="font-semibold mb-3">Write a Review</h3>
            <select value={review.rating} onChange={e => setReview({ ...review, rating: Number(e.target.value) })} className="border rounded px-3 py-1 mb-3 w-full">
              {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
            </select>
            <textarea value={review.comment} onChange={e => setReview({ ...review, comment: e.target.value })}
              placeholder="Share your experience..." rows={3} className="border rounded w-full px-3 py-2 mb-3 text-sm" required />
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700">Submit</button>
          </form>
        )}
      </div>
    </div>
  );
}
