import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    return '/dashboard';
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🏠 PropRental</Link>
      </div>
      <div className="navbar-links">
        <Link to="/properties">Browse Properties</Link>
        {user ? (
          <>
            <Link to={getDashboardLink()}>Dashboard</Link>
            <span style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '14px'
            }}>
              Hi, {user.name}
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              color: 'white'
            }}>
              {user.role}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ padding: '6px 14px', fontSize: '13px' }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" style={{
              background: 'white',
              color: '#7c3aed',
              padding: '6px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              textDecoration: 'none'
            }}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;