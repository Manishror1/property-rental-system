import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword, validateName } from '../utils/validators';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
    setApiError('');
  };

  const validate = () => {
    const newErrors = {};
    const nameErr = validateName(formData.name);
    const emailErr = validateEmail(formData.email);
    const passErr = validatePassword(formData.password);
    if (nameErr) newErrors.name = nameErr;
    if (emailErr) newErrors.email = emailErr;
    if (passErr) newErrors.password = passErr;
    return newErrors;
  };

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
      setApiError(error.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f3f4f6' }}>
      <div className="card" style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px' }}>🏠</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginTop: '8px' }}>Create Account</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Join Property Rental System</p>
        </div>

        {apiError && <div className="alert alert-error">{apiError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <div className="form-group">
            <label>Phone (Optional)</label>
            <input
              type="text"
              name="phone"
              placeholder="Your phone number"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

{/* Divider */}
<div style={{
  display: 'flex', alignItems: 'center',
  gap: '12px', margin: '20px 0'
}}>
  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
  <span style={{ fontSize: '13px', color: '#9ca3af' }}>OR</span>
  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
</div>

<a href="http://localhost:5000/api/auth/google" style={{
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: '10px', width: '100%', padding: '12px',
  background: 'white', border: '1px solid #e5e7eb',
  borderRadius: '8px', textDecoration: 'none',
  color: '#374151', fontSize: '14px', fontWeight: '500',
  cursor: 'pointer'
}}>
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  Sign up with Google
</a>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#7c3aed', fontWeight: '600' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;