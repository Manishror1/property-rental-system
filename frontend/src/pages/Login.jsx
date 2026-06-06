/**
 * Login.jsx — Authentication Page
 * Features: Email/Password login + Google OAuth
 * Validation: Client-side with validators utility
 * Design: Split layout with gradient left panel
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword } from '../utils/validators';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Form State ───────────────────────────────────────────────
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────

  /** Update field value and clear related errors */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
    setApiError('');
  };

  /** Client-side validation before API call */
  const validate = () => {
    const newErrors = {};
    const emailErr = validateEmail(formData.email);
    const passErr = validatePassword(formData.password);
    if (emailErr) newErrors.email = emailErr;
    if (passErr) newErrors.password = passErr;
    return newErrors;
  };

  /** Handle form submission — JWT login */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs first
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const user = await login(formData.email, formData.password);

      // Redirect back to where user came from, or role-based default
      const from = location.state?.from;
      if (from && from !== '/login' && from !== '/register') {
        navigate(from);
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setApiError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f3f4f6',
    }}>

      {/* ── LEFT PANEL — Branding (hidden on mobile) ─────────── */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}
        className="login-left-panel"
      >

        {/* Background decorative circles */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'rgba(124,58,237,0.15)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: '240px', height: '240px', borderRadius: '50%',
          background: 'rgba(99,102,241,0.1)',
          pointerEvents: 'none'
        }} />

        {/* Brand content */}
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '380px' }}>

          {/* App icon */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '24px',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '40px', margin: '0 auto 28px',
            boxShadow: '0 20px 40px rgba(124,58,237,0.4)',
          }}>
            🏠
          </div>

          {/* App name */}
          <h1 style={{
            fontSize: '36px', fontWeight: '800', color: 'white',
            marginBottom: '12px', letterSpacing: '-0.5px', lineHeight: '1.2'
          }}>
            PropRental
          </h1>

          <p style={{
            fontSize: '16px', color: 'rgba(255,255,255,0.6)',
            lineHeight: '1.7', marginBottom: '40px'
          }}>
            Find your perfect rental property or list yours to reach thousands of tenants.
          </p>

          {/* Feature highlights */}
          {[
            { icon: '🔍', text: 'Browse thousands of properties' },
            { icon: '📅', text: 'Book viewings instantly' },
            { icon: '💬', text: 'Message owners directly' },
            { icon: '🔔', text: 'Real-time push notifications' },
          ].map((feature, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '14px', textAlign: 'left',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '16px', flexShrink: 0
              }}>
                {feature.icon}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — Login Form ──────────────────────────── */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        background: 'white',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          {/* Form header */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '26px', fontWeight: '700',
              color: '#111827', marginBottom: '6px',
              letterSpacing: '-0.3px'
            }}>
              Welcome back 👋
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Sign in to your PropRental account
            </p>
          </div>

          {/* API Error Alert */}
          {apiError && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              ⚠️ {apiError}
            </div>
          )}

          {/* ── Login Form ─────────────────────────────────────── */}
          <form onSubmit={handleSubmit}>

            {/* Email Field */}
            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)', fontSize: '16px',
                  pointerEvents: 'none', zIndex: 1
                }}>
                  📧
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    paddingLeft: '40px',
                    borderColor: errors.email ? '#dc2626' : undefined
                  }}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="error-text">⚠ {errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)', fontSize: '16px',
                  pointerEvents: 'none'
                }}>
                  🔒
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    paddingLeft: '40px',
                    paddingRight: '44px',
                    borderColor: errors.password ? '#dc2626' : undefined
                  }}
                  autoComplete="current-password"
                />
                {/* Show/hide password toggle */}

              </div>
              {errors.password && (
                <p className="error-text">⚠ {errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '4px', fontSize: '15px' }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{
                    width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: 'white', borderRadius: '50%',
                    display: 'inline-block', animation: 'spin 0.7s linear infinite'
                  }} />
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          {/* ── Divider ─────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: '12px', margin: '24px 0'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
            <span style={{
              fontSize: '12px', color: '#9ca3af', fontWeight: '500',
              padding: '0 4px', background: 'white'
            }}>
              OR CONTINUE WITH
            </span>
            <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
          </div>

          {/* ── Google OAuth Button ──────────────────────────────── */}

          <a
            href="http://localhost:5000/api/auth/google"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', width: '100%', padding: '12px 16px',
              background: 'white', border: '1.5px solid #e5e7eb',
              borderRadius: '10px', textDecoration: 'none',
              color: '#374151', fontSize: '14px', fontWeight: '500',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
            }}
          >
            {/* Google SVG Icon */}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          {/* ── Register Link ────────────────────────────────────── */}
          <p style={{
            textAlign: 'center', marginTop: '28px',
            fontSize: '14px', color: '#6b7280'
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: '#7c3aed', fontWeight: '600',
              textDecoration: 'none',
              borderBottom: '1px solid transparent',
              transition: 'border-color 0.15s'
            }}
              onMouseEnter={e => e.currentTarget.style.borderBottomColor = '#7c3aed'}
              onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
            >
              Create an account →
            </Link>
          </p>

          {/* ── Footer Note ──────────────────────────────────────── */}
          <p style={{
            textAlign: 'center', marginTop: '24px',
            fontSize: '11px', color: '#d1d5db', lineHeight: '1.6'
          }}>
            By signing in, you agree to our Terms of Service
            <br />and Privacy Policy
          </p>

        </div>
      </div>

      {/* Responsive styles for mobile */}
      <style>{`
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};

export default Login;