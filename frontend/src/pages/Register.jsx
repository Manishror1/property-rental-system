import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword, validateName } from '../utils/validators';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // ── Form State ───────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────

  /** Update field and clear related error */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
    setApiError('');
  };

  /** Client-side validation */
  const validate = () => {
    const newErrors = {};
    const nameErr  = validateName(formData.name);
    const emailErr = validateEmail(formData.email);
    const passErr  = validatePassword(formData.password);
    if (nameErr)  newErrors.name     = nameErr;
    if (emailErr) newErrors.email    = emailErr;
    if (passErr)  newErrors.password = passErr;
    return newErrors;
  };

  /** Handle form submission */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      const user = await register(formData);
      if (user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (error) {
      setApiError(error.response?.data?.message || 'Registration failed. Please try again.');
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

      {/* ── LEFT PANEL — Branding ────────────────────────────── */}
      <div
        className="register-left-panel"
        style={{
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
      >
        {/* Decorative background circles */}
        <div style={{
          position: 'absolute', top: '-60px', left: '-60px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'rgba(124,58,237,0.12)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', right: '-80px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'rgba(99,102,241,0.08)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', top: '50%', right: '-40px',
          width: '180px', height: '180px', borderRadius: '50%',
          background: 'rgba(139,92,246,0.08)', pointerEvents: 'none'
        }} />

        {/* Brand content */}
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '380px' }}>

          {/* App Icon */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '24px',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '40px',
            margin: '0 auto 28px',
            boxShadow: '0 20px 40px rgba(124,58,237,0.4)',
          }}>
            🏠
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: '34px', fontWeight: '800',
            color: 'white', marginBottom: '12px',
            letterSpacing: '-0.5px', lineHeight: '1.2'
          }}>
            Join PropRental
          </h1>

          <p style={{
            fontSize: '15px', color: 'rgba(255,255,255,0.55)',
            lineHeight: '1.7', marginBottom: '40px'
          }}>
            Create your free account and start your property journey today.
          </p>

          {/* Steps */}
          {[
            { step: '01', title: 'Create your account',  desc: 'Quick and easy setup in minutes' },
            { step: '02', title: 'Browse properties',     desc: 'Explore thousands of listings' },
            { step: '03', title: 'Book a viewing',        desc: 'Schedule visits with one click' },
            { step: '04', title: 'Find your home',        desc: 'Connect with owners directly' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start',
              gap: '14px', marginBottom: '18px', textAlign: 'left'
            }}>
              {/* Step number badge */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.6), rgba(99,102,241,0.4))',
                border: '1px solid rgba(124,58,237,0.4)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
                fontSize: '11px', fontWeight: '700', color: '#c4b5fd'
              }}>
                {item.step}
              </div>
              <div>
                <p style={{ color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>
                  {item.title}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}

          {/* Social proof testimonial */}
          <div style={{
            marginTop: '32px', padding: '16px 20px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', textAlign: 'left'
          }}>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
              {'⭐⭐⭐⭐⭐'.split('').map((s, i) => (
                <span key={i} style={{ fontSize: '12px' }}>{s}</span>
              ))}
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.7)', fontSize: '13px',
              lineHeight: '1.6', fontStyle: 'italic'
            }}>
              "Found my perfect apartment in just 3 days!"
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '6px' }}>
              — Sarah W., Auckland
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Register Form ───────────────────────── */}
      <div style={{
        width: '100%',
        maxWidth: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        background: 'white',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.06)',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Form header */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{
              fontSize: '26px', fontWeight: '700',
              color: '#111827', marginBottom: '6px',
              letterSpacing: '-0.3px'
            }}>
              Create account 🎉
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Fill in your details to get started
            </p>
          </div>

          {/* API Error Alert */}
          {apiError && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              ⚠️ {apiError}
            </div>
          )}

          {/* ── Registration Form ───────────────────────────────── */}
          <form onSubmit={handleSubmit}>

            {/* Full Name */}
            <div className="form-group">
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)', fontSize: '15px',
                  pointerEvents: 'none'
                }}>👤</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    paddingLeft: '40px',
                    borderColor: errors.name ? '#dc2626' : undefined
                  }}
                />
              </div>
              {errors.name && <p className="error-text">⚠ {errors.name}</p>}
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)', fontSize: '15px',
                  pointerEvents: 'none'
                }}>📧</span>
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
                />
              </div>
              {errors.email && <p className="error-text">⚠ {errors.email}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)', fontSize: '15px',
                  pointerEvents: 'none'
                }}>🔒</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    paddingLeft: '40px',
                    borderColor: errors.password ? '#dc2626' : undefined
                  }}
                />
              </div>
              {errors.password && <p className="error-text">⚠ {errors.password}</p>}
            </div>

            {/* Phone (Optional) */}
            <div className="form-group">
              <label>
                Phone Number
                <span style={{
                  fontSize: '11px', color: '#9ca3af',
                  fontWeight: '400', marginLeft: '6px'
                }}>
                  (optional)
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)', fontSize: '15px',
                  pointerEvents: 'none'
                }}>📱</span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="e.g. 021 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%', padding: '12px',
                marginTop: '4px', fontSize: '15px'
              }}
              disabled={loading}
            >
              {loading ? (
                <span style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px'
                }}>
                  <span style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: 'white', borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite'
                  }} />
                  Creating account...
                </span>
              ) : 'Create Account →'}
            </button>
          </form>

          {/* ── Divider ──────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: '12px', margin: '24px 0'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
            <span style={{
              fontSize: '12px', color: '#9ca3af',
              fontWeight: '500', padding: '0 4px'
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
            Sign up with Google
          </a>

          {/* ── Login Link ───────────────────────────────────────── */}
          <p style={{
            textAlign: 'center', marginTop: '24px',
            fontSize: '14px', color: '#6b7280'
          }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: '#7c3aed', fontWeight: '600',
                textDecoration: 'none',
                borderBottom: '1px solid transparent',
                transition: 'border-color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderBottomColor = '#7c3aed'}
              onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
            >
              Sign in →
            </Link>
          </p>

          {/* Terms note */}
          <p style={{
            textAlign: 'center', marginTop: '20px',
            fontSize: '11px', color: '#d1d5db', lineHeight: '1.6'
          }}>
            By creating an account, you agree to our
            <br />Terms of Service and Privacy Policy
          </p>

        </div>
      </div>

      {/* Responsive + animation styles */}
      <style>{`
        @media (max-width: 768px) {
          .register-left-panel { display: none !important; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};
/**
 * Register.jsx — User Registration Page
 * Features: Name/Email/Password/Phone + Google OAuth signup
 * Validation: Client-side with validators utility
 * Design: Split layout — matching Login page style
 */
export default Register;