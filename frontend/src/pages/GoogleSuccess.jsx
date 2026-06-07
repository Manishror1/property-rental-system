import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const GoogleSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

    // ── Extract OAuth data from URL query params ────────────────────

  useEffect(() => {    
    // Extract token and user data from URL
    const token = searchParams.get('token');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const role = searchParams.get('role');
    const id = searchParams.get('id');
    const error = searchParams.get('error');
    // ── Error Handling — if OAuth failed, redirect to login ────────

    if (error) {
      navigate('/login?error=google_failed');
      return;
    }

      // Store JWT token in localStorage
    if (token) {
      localStorage.setItem('token', token);
      const userData = { id, name, email, role };
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // ── Role-Based Redirect ─────────────────────────────────────

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, []);

  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      alignItems: 'center', height: '100vh', background: '#f3f4f6'
    }}>
                {/* Loading spinner animation */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔄</div>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Signing you in with Google...
        </p>
      </div>
    </div>
  );
};

export default GoogleSuccess;