import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import BannerSlider from '../components/layout/BannerSlider';
import ProductCard from '../components/product/ProductCard';

const categories = [
  { name: 'Men', slug: 'men', image: 'https://res.cloudinary.com/u1malbew/image/upload/v1782990349/How-To-Dress-For-Your-Age-20s-30s-40s-50s-1_uwdzwn.jpg', color: 'bg-blue-100', subs: ['Shirts', 'Pants', 'Hoodies', 'Jackets', 'Suits'] },
  { name: 'Women', slug: 'women', image: 'https://res.cloudinary.com/u1malbew/image/upload/v1782990258/photo-collage.png_13_1_w32jbf.png', color: 'bg-pink-100', subs: ['Dresses', 'Jeans', 'Jackets', 'Tops', 'Skirts'] },
  { name: 'Kids', slug: 'kids', image: 'https://res.cloudinary.com/u1malbew/image/upload/v1782990064/couple-child-girl-boy-fashionable-clothes-cute-stylish-little-red-hearts-stick-sittting-together-studio-kids-169022263_av27fb.jpg', color: 'bg-yellow-100', subs: ['T-Shirts', 'Bottoms', 'Jackets', 'Dresses'] },
  { name: 'Footwear', slug: 'footwear', image: 'https://res.cloudinary.com/u1malbew/image/upload/v1782988196/cld-sample-5.jpg', color: 'bg-green-100', subs: ['Sneakers', 'Boots', 'Running', 'Sandals'] },
  { name: 'Jewelry', slug: 'jewelry', image: 'https://res.cloudinary.com/u1malbew/image/upload/v1782988720/partnerimages_2F9ec17df5_11017324_1_sdjabh.jpg', color: 'bg-purple-100', subs: ['Earrings', 'Necklaces', 'Bracelets', 'Rings', 'Luxury Watches'] },
  { name: 'Accessories', slug: 'accessories', image: 'https://res.cloudinary.com/u1malbew/image/upload/v1782998159/new_header_spence_12_yhyuoi.jpg', color: 'bg-orange-100', subs: ['Wallets', 'Bags', 'Sunglasses', 'Belts', 'Smart Watches'] },
  { name: 'Sportswear', slug: 'sportswear', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop', color: 'bg-red-100', subs: ['T-Shirts', 'Leggings', 'Jackets', 'Shorts'] },
  { name: 'Beauty', slug: 'beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop', color: 'bg-rose-100', subs: ['Skincare', 'Makeup', 'Fragrance', 'Haircare'] },
];

const countries = [
  { name: 'United States', flag: '🇺🇸', city: 'New York', products: '2.4K+', bg: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&h=300&fit=crop' },
  { name: 'United Kingdom', flag: '🇬🇧', city: 'London', products: '1.8K+', bg: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop' },
  { name: 'France', flag: '🇫🇷', city: 'Paris', products: '1.2K+', bg: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop' },
  { name: 'Italy', flag: '🇮🇹', city: 'Milan', products: '980+', bg: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=400&h=300&fit=crop' },
  { name: 'Japan', flag: '🇯🇵', city: 'Tokyo', products: '870+', bg: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop' },
  { name: 'Germany', flag: '🇩🇪', city: 'Berlin', products: '760+', bg: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&h=300&fit=crop' },
  { name: 'Canada', flag: '🇨🇦', city: 'Toronto', products: '650+', bg: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=400&h=300&fit=crop' },
  { name: 'Australia', flag: '🇦🇺', city: 'Sydney', products: '540+', bg: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=300&fit=crop' },
  { name: 'UAE', flag: '🇦🇪', city: 'Dubai', products: '490+', bg: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop' },
  { name: 'India', flag: '🇮🇳', city: 'Mumbai', products: '430+', bg: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=300&fit=crop' },
];

const stories = [
  { name: 'Sarah M.', country: 'New York, USA', flag: '🇺🇸', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', rating: 5, text: 'StyleHub completely transformed my wardrobe! The quality is amazing and delivery was super fast. I get compliments every time I wear my new outfits.', product: "Women's Collection", verified: true },
  { name: 'James K.', country: 'London, UK', flag: '🇬🇧', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', rating: 5, text: "As a busy professional, I love how easy it is to find stylish men's clothing here. The filters make it so simple to find exactly what I need.", product: "Men's Collection", verified: true },
  { name: 'Aisha R.', country: 'Dubai, UAE', flag: '🇦🇪', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', rating: 5, text: "Bought jewelry and accessories for my daughter's wedding. Everything was exactly as described and the packaging was beautiful. Will definitely shop again!", product: 'Jewelry & Accessories', verified: true },
  { name: 'Carlos D.', country: 'Madrid, Spain', flag: '🇪🇸', avatar: 'https://randomuser.me/api/portraits/men/75.jpg', rating: 4, text: 'Great selection of sportswear. The prices are very competitive and the sizing guide was accurate. My order arrived in perfect condition.', product: 'Sportswear', verified: true },
  { name: 'Yuki T.', country: 'Tokyo, Japan', flag: '🇯🇵', avatar: 'https://randomuser.me/api/portraits/women/90.jpg', rating: 5, text: "I've been shopping here for 6 months now and every single order has been perfect. The kids' collection is adorable and great quality!", product: 'Kids Collection', verified: true },
  { name: 'Priya S.', country: 'Mumbai, India', flag: '🇮🇳', avatar: 'https://randomuser.me/api/portraits/women/55.jpg', rating: 5, text: 'The beauty products are authentic and arrived well-packaged. Customer service was very helpful when I had a question about my order.', product: 'Beauty', verified: true },
];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [catIndex, setCatIndex] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const visibleCount = 5;
  const visibleStories = 3;

  const slidePrev = () => setCatIndex(i => Math.max(0, i - 1));
  const slideNext = () => setCatIndex(i => Math.min(categories.length - visibleCount, i + 1));
  const storyPrev = () => setStoryIndex(i => Math.max(0, i - 1));
  const storyNext = () => setStoryIndex(i => Math.min(stories.length - visibleStories, i + 1));

  useEffect(() => {
    api.get('/products/featured')
      .then(res => setFeatured(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get('/recommendations?topK=4')
      .then(res => setRecommendations(res.data))
      .catch(() => setRecommendations([]))
      .finally(() => setRecommendationsLoading(false));

    api.get('/banners')
      .then(res => setBanners(res.data))
      .catch(() => setBanners([]));
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="relative h-screen min-h-[600px] overflow-hidden">
        <img src="https://res.cloudinary.com/u1malbew/image/upload/v1782988196/cld-sample-5.jpg" alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-55"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <span className="inline-block border border-white border-opacity-40 text-white text-xs font-semibold px-4 py-1 rounded-full mb-6 tracking-widest uppercase bg-white bg-opacity-10">
            New Season Arrivals
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
            Style<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Hub</span>
          </h1>
          <p className="text-lg md:text-2xl font-light text-gray-200 mb-3">
            Fashion for <span className="text-white font-semibold">Everyone</span>
          </p>
          <p className="text-sm md:text-base text-gray-300 mb-10 max-w-xl mx-auto">
            Discover the latest trends in clothing, footwear & jewelry — curated for men, women, kids and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-8 py-3 rounded-full hover:opacity-90 transition shadow-lg">
              Shop Now →
            </Link>
            <Link to="/register" className="border border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-white hover:text-gray-900 transition">
              Become a Seller
            </Link>
          </div>
          <div className="flex justify-center gap-10 mt-14 text-center">
            {[['10K+', 'Products'], ['50K+', 'Happy Customers'], ['500+', 'Brands']].map(([val, label]) => (
              <div key={label}>
                <p className="text-white text-2xl font-bold drop-shadow">{val}</p>
                <p className="text-gray-300 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white opacity-60 animate-bounce text-2xl">↓</div>
      </div>

      {/* Active Home Banners */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <BannerSlider banners={banners} />
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Shop by Category</h2>
        <div className="relative">
          {catIndex > 0 && (
            <button onClick={slidePrev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition text-xl">‹</button>
          )}
          <div className="grid grid-cols-5 gap-4 overflow-hidden">
            {categories.slice(catIndex, catIndex + visibleCount).map(cat => (
              <div key={cat.slug} className="flex flex-col gap-2">
                <Link to={`/products?category=${cat.slug}`} className="relative overflow-hidden rounded-2xl group h-56">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black bg-opacity-25 group-hover:bg-opacity-50 transition duration-500"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
                    <span className="text-white text-lg font-bold drop-shadow">{cat.name}</span>
                    <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition duration-300 mt-1 border border-white px-3 py-1 rounded-full">Shop All</span>
                  </div>
                </Link>
                {/* Subcategory pills */}
                <div className="flex flex-wrap gap-1 justify-center">
                  {cat.subs.map(sub => (
                    <Link
                      key={sub}
                      to={`/products?category=${cat.slug}&subCategory=${sub}`}
                      className="text-xs bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-gray-600 px-2 py-0.5 rounded-full transition"
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {catIndex < categories.length - visibleCount && (
            <button onClick={slideNext} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition text-xl">›</button>
          )}
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: categories.length - visibleCount + 1 }).map((_, i) => (
              <button key={i} onClick={() => setCatIndex(i)} className={`h-2 rounded-full transition-all ${catIndex === i ? 'bg-indigo-600 w-4' : 'bg-gray-300 w-2'}`} />
            ))}
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">Recommended for you</p>
              <h2 className="text-2xl font-bold text-gray-800">Personalized picks</h2>
            </div>
          </div>
          {recommendationsLoading ? (
            <div className="text-center py-8 text-gray-400">Loading your picks...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recommendations.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      )}

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Featured Products</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : featured.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No featured products yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      {/* Explore by Countries */}
      <div className="bg-gray-900 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-indigo-400 text-sm font-semibold uppercase tracking-widest">Global Fashion</span>
            <h2 className="text-3xl font-bold text-white mt-2">Explore by Country</h2>
            <p className="text-gray-400 mt-2">Discover fashion trends and brands from around the world</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {countries.slice(0, 5).map(c => (
              <Link key={c.name} to={`/products`} className="relative overflow-hidden rounded-2xl group h-48 cursor-pointer">
                <img src={c.bg} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 px-2 text-center">
                  <span className="text-3xl mb-1">{c.flag}</span>
                  <p className="text-white font-bold text-sm">{c.name}</p>
                  <p className="text-gray-300 text-xs">{c.city}</p>
                  <p className="text-indigo-300 text-xs font-semibold mt-1">{c.products} products</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            {countries.slice(5).map(c => (
              <Link key={c.name} to={`/products`} className="relative overflow-hidden rounded-2xl group h-48 cursor-pointer">
                <img src={c.bg} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 px-2 text-center">
                  <span className="text-3xl mb-1">{c.flag}</span>
                  <p className="text-white font-bold text-sm">{c.name}</p>
                  <p className="text-gray-300 text-xs">{c.city}</p>
                  <p className="text-indigo-300 text-xs font-semibold mt-1">{c.products} products</p>
                </div>
              </Link>
            ))}
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 border-t border-gray-700 pt-10">
            {[['50+', 'Countries Served'], ['10K+', 'Global Products'], ['500+', 'International Brands'], ['99%', 'Delivery Success']].map(([val, label]) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-bold text-indigo-400">{val}</p>
                <p className="text-gray-400 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Stories */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-purple-600 text-sm font-semibold uppercase tracking-widest">Testimonials</span>
            <h2 className="text-3xl font-bold text-gray-800 mt-2">Customer Stories</h2>
            <p className="text-gray-500 mt-2">Real experiences from our happy shoppers around the world</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-yellow-400 text-lg">★★★★★</span>
              <span className="text-gray-600 font-semibold">4.9/5</span>
              <span className="text-gray-400 text-sm">from 12,000+ reviews</span>
            </div>
          </div>

          {/* Slider */}
          <div className="relative">
            {storyIndex > 0 && (
              <button onClick={storyPrev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition text-xl">‹</button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stories.slice(storyIndex, storyIndex + visibleStories).map((s, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition relative">
                  {/* Quote icon */}
                  <div className="text-5xl text-indigo-100 font-serif absolute top-4 right-6 leading-none">"</div>
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <span key={j} className={`text-lg ${j < s.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                  {/* Review text */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-5">{s.text}</p>
                  {/* Product tag */}
                  <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-medium px-3 py-1 rounded-full mb-4">{s.product}</span>
                  {/* Divider */}
                  <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
                    <img src={s.avatar} alt={s.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-100" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
                        {s.verified && <span className="text-indigo-500 text-xs">✓ Verified</span>}
                      </div>
                      <p className="text-gray-400 text-xs">{s.flag} {s.country}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {storyIndex < stories.length - visibleStories && (
              <button onClick={storyNext} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition text-xl">›</button>
            )}
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: stories.length - visibleStories + 1 }).map((_, i) => (
                <button key={i} onClick={() => setStoryIndex(i)} className={`h-2 rounded-full transition-all ${storyIndex === i ? 'bg-purple-600 w-4' : 'bg-gray-300 w-2'}`} />
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[
              { icon: '🔒', title: 'Secure Payments', desc: 'SSL encrypted checkout' },
              { icon: '🚚', title: 'Fast Delivery', desc: 'Ships within 24 hours' },
              { icon: '↩️', title: 'Easy Returns', desc: '7-day return policy' },
              { icon: '🎧', title: '24/7 Support', desc: 'Always here to help' },
            ].map(b => (
              <div key={b.title} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <span className="text-3xl">{b.icon}</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{b.title}</p>
                  <p className="text-gray-400 text-xs">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works for Shoppers */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">How it Works for Shoppers</h2>
        <p className="text-center text-gray-500 mb-8">Get your favourite fashion in 3 easy steps</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '1', emoji: '🔍', title: 'Browse & Discover', desc: 'Explore thousands of products across men, women, kids, footwear and jewelry categories.' },
            { step: '2', emoji: '🛒', title: 'Add to Cart', desc: 'Pick your size, color and quantity, then add items to your cart with one click.' },
            { step: '3', emoji: '📦', title: 'Checkout & Track', desc: 'Place your order securely and track its status from your orders page.' },
          ].map(s => (
            <div key={s.step} className="bg-white rounded-2xl shadow p-6 text-center hover:shadow-md transition">
              <div className="text-4xl mb-3">{s.emoji}</div>
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">{s.step}</div>
              <h3 className="font-semibold text-gray-800 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works for Sellers */}
      <div className="bg-indigo-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">How it Works for Sellers</h2>
          <p className="text-center text-gray-500 mb-8">Start selling your products to thousands of customers</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', emoji: '📝', title: 'Create an Account', desc: 'Register and select seller as your account type during sign up.' },
              { step: '2', emoji: '🏷️', title: 'List Your Products', desc: 'Add your products with images, sizes, colors, pricing and stock from your seller dashboard.' },
              { step: '3', emoji: '💰', title: 'Manage & Earn', desc: 'Receive orders, update order statuses and grow your business through our platform.' },
            ].map(s => (
              <div key={s.step} className="bg-white rounded-2xl shadow p-6 text-center hover:shadow-md transition">
                <div className="text-4xl mb-3">{s.emoji}</div>
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">{s.step}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/register" className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 font-medium">Become a Seller</Link>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Free Shipping on Orders Over $50</h2>
        <p className="text-indigo-100 mb-4">Use code <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded">STYLE10</span> for 10% off your first order</p>
        <Link to="/products" className="bg-white text-indigo-600 font-semibold px-6 py-2 rounded-full hover:bg-indigo-50 transition">Browse All</Link>
      </div>
    </div>
  );
}
