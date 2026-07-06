import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const isDev = import.meta.env.DEV;

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      toast.success('Login successful!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full rounded-xl pl-9 pr-4 py-2.5 text-sm bg-slate-950 border border-white/15 text-white placeholder:text-white/60 caret-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-violet-400/70 focus:border-transparent focus:bg-slate-950 hover:bg-slate-900 transition-all duration-200";

  return (
    <div className="min-h-screen overflow-x-hidden overflow-y-auto relative flex flex-col" style={{
      backgroundImage: `url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1920&q=90&fit=crop')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-indigo-950/70 to-black/88" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4 flex-shrink-0">
        <Link to="/" className="inline-flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-violet-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <span className="text-base font-bold tracking-[0.35em]">SH</span>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-white text-base font-semibold tracking-[0.24em] uppercase">StyleHub</span>
            <span className="text-[10px] text-violet-200/55">Luxury Fashion</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden sm:flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur text-white text-xs font-semibold px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            New Collection — Summer '25
          </span>
          <Link to="/" className="group inline-flex items-center gap-2 text-white/70 hover:text-white text-xs transition-colors">
            <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Store
          </Link>
        </div>
      </div>

      {/* Centered layout */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="w-full flex items-center justify-center gap-16 max-w-4xl">

          {/* Left: brand copy — hidden on small screens */}
          <div className="hidden lg:flex flex-col max-w-xs">
            <span className="inline-flex items-center bg-amber-400/90 text-amber-900 text-xs font-bold px-3 py-1 rounded-full mb-5 w-fit">
              🎉 UP TO 60% OFF — SUMMER SALE
            </span>
            <h2 className="text-white text-5xl font-bold leading-tight mb-4">Dress to<br />Impress.</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Explore thousands of styles across Men, Women, Kids &amp; more. Sign in to unlock exclusive member deals.
            </p>
            <div className="flex flex-col gap-2">
              {[['✓', 'Free shipping on orders over ₹499'], ['✓', 'Easy 30-day returns'], ['✓', 'Secure encrypted payments']].map(([icon, text]) => (
                <span key={text} className="flex items-center gap-2 text-white/50 text-xs">
                  <span className="text-emerald-400 font-bold">{icon}</span>{text}
                </span>
              ))}
            </div>
          </div>

          {/* Glass card */}
          <div className="w-full max-w-sm" style={{ animation: 'slideUp 0.45s cubic-bezier(0.16,1,0.3,1) both' }}>
            <div className="rounded-2xl border border-white/15 p-7" style={{
              background: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(26px)',
              WebkitBackdropFilter: 'blur(26px)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}>
              <div className="mb-5">
                <h1 className="text-xl font-bold text-white">Welcome back</h1>
                <p className="text-white/90 text-sm mt-0.5">Sign in to your StyleHub account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-white/90 mb-1">Email address</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-3 flex items-center text-white/40 group-focus-within:text-white/70 transition-colors pointer-events-none">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input type="email" placeholder="you@example.com"  required value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} className={inp} />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-white/70">Password</label>
                    <button type="button" className="text-xs text-white/80 hover:text-white transition-colors">Forgot?</button>
                  </div>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-3 flex items-center text-white/40 group-focus-within:text-white/70 transition-colors pointer-events-none">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" required
                      value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                      className={`${inp} pr-9`} />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-white/80 transition-colors">
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border border-white/20 bg-slate-950/80 text-violet-400 accent-violet-400 focus:ring-2 focus:ring-violet-400/70" />
                  <span className="text-xs text-white/80">Remember me</span>
                </label>

                {/* Sign in */}
                <button type="submit" disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:shadow-[0_20px_60px_-30px_rgba(99,102,241,0.6)] hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>Signing in...</>
                  ) : 'Sign In'}
                </button>

                {/* Trust */}
                <p className="flex items-center justify-center gap-1 text-xs text-white/70">
                  <svg className="w-3 h-3 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Secure &amp; encrypted — your data is safe
                </p>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/30" />
                  <span className="text-xs text-white/70 uppercase tracking-[0.25em]">or</span>
                  <div className="flex-1 h-px bg-white/30" />
                </div>

                {/* Google + Guest */}
                <div className="grid grid-cols-2 gap-2">
                  <button type="button"
                    className="h-12 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 text-sm font-semibold text-white hover:bg-white/15 transition-all duration-200">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </button>
                  <button type="button" onClick={() => navigate('/')}
                    className="h-12 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 text-sm font-semibold text-white hover:bg-white/15 transition-all duration-200">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Guest
                  </button>
                </div>
              </form>

              <p className="text-center text-xs text-white/50 mt-4">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-300 hover:text-white font-semibold transition-colors">Create one free</Link>
              </p>

              {isDev && (
                <div className="mt-3 p-2.5 rounded-lg border border-amber-400/30 bg-amber-400/10 text-xs text-amber-200">
                  <p className="font-bold mb-0.5 flex items-center gap-1">
                    <span className="bg-amber-400 text-amber-900 px-1 py-0.5 rounded text-xs font-bold">DEV</span>
                    Demo Credentials
                  </p>
                  <p className="opacity-80">client@gmail.com / password123</p>
                  <p className="opacity-80">admin@gmail.com / password123</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-center gap-5 py-3 flex-shrink-0">
        {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', '/contact'], ['Help', '/shipping']].map(([label, path]) => (
          <Link key={label} to={path} className="text-xs text-white/30 hover:text-white/70 transition-colors">{label}</Link>
        ))}
      </div>

      <style>{`
        input {
          color: #0b0b0b !important;
        }

        input::placeholder {
          color: rgba(6, 6, 6, 0.6) !important;
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff !important;
          color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px #020617 inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
