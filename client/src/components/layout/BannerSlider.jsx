import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function BannerSlider({ banners = [] }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent(i => (i + 1) % banners.length), 5000);
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [banners.length]);

  if (!banners.length) return null;

  const b = banners[current];

  const handleCopy = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(b.coupon_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const goTo = (i) => { setCurrent(i); resetTimer(); };
  const prev = () => { setCurrent(i => (i - 1 + banners.length) % banners.length); resetTimer(); };
  const next = () => { setCurrent(i => (i + 1) % banners.length); resetTimer(); };

  const isExternal = b.redirect_url?.startsWith('http');

  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: '200px' }}>
      {/* Banner */}
      <div
        className="relative w-full flex items-center transition-all duration-500"
        style={{
          minHeight: '200px',
          background: b.image_url ? 'transparent' : (b.bg_color || '#4F46E5'),
        }}
      >
        {b.image_url && (
          <img src={b.image_url} alt={b.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0" style={{ background: b.image_url ? 'rgba(0,0,0,0.5)' : 'transparent' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 w-full flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          style={{ color: b.image_url ? '#fff' : (b.text_color || '#fff') }}>
          <div className="flex flex-col gap-2">
            {b.discount_text && (
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-white bg-opacity-20 border border-white border-opacity-30 w-fit">
                🏷️ {b.discount_text}
              </span>
            )}
            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">{b.title}</h2>
            {b.subtitle && <p className="text-sm md:text-base opacity-90">{b.subtitle}</p>}
            {b.coupon_code && (
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Code:</span>
                  <button
                    onClick={handleCopy}
                    className="font-bold font-mono px-3 py-1 rounded bg-white bg-opacity-20 border border-white border-opacity-40 hover:bg-opacity-30 transition text-sm flex items-center gap-1"
                  >
                    {b.coupon_code}
                    <span className="text-xs opacity-70">{copied ? '✓ Copied!' : '📋'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/checkout?coupon=${encodeURIComponent(b.coupon_code)}`)}
                  className="inline-flex items-center justify-center w-fit text-xs font-semibold px-3 py-1 rounded-full bg-white bg-opacity-90 text-gray-900 hover:bg-opacity-100 transition"
                >
                  Apply at checkout
                </button>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            {isExternal ? (
              <a href={b.redirect_url} target="_blank" rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-full font-semibold text-sm bg-white text-gray-900 hover:bg-gray-100 transition shadow">
                Shop Now →
              </a>
            ) : (
              <Link to={b.redirect_url || '/products'}
                className="inline-block px-6 py-3 rounded-full font-semibold text-sm bg-white text-gray-900 hover:bg-gray-100 transition shadow">
                Shop Now →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Prev / Next */}
      {banners.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black bg-opacity-30 hover:bg-opacity-50 text-white w-8 h-8 rounded-full flex items-center justify-center transition text-lg">‹</button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black bg-opacity-30 hover:bg-opacity-50 text-white w-8 h-8 rounded-full flex items-center justify-center transition text-lg">›</button>
          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {banners.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-5' : 'bg-white bg-opacity-50 w-1.5'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
