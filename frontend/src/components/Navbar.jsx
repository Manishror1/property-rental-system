import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  // ✅ Both user AND admin ke liye counts fetch karo
  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      try {
        const [msgRes, notifRes, wishlistRes] = await Promise.all([
          api.get('/messages/unread-count'),
          api.get('/notifications'),
          api.get('/auth/wishlist'),
        ]);
        setUnreadMsg(msgRes.data.count || 0);
        setUnreadNotif(notifRes.data.notifications?.filter(n => !n.isRead).length || 0);
        setSavedCount(wishlistRes.data.savedProperties?.length || 0);
      } catch (e) {
        // silent fail
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const totalBadge = unreadMsg + unreadNotif;

  return (
    <nav style={{
      background: '#0f172a', color: 'white',
      padding: '0 32px', height: '64px',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 1000,
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
    }}>

      {/* Brand */}
      <Link to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/'}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'white' }}>
        <span style={{ fontSize: '24px' }}>🏠</span>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '700', lineHeight: '1.2' }}>PropRental</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: '1' }}>
            Property Booking System
          </div>
        </div>
      </Link>

      {/* Center — Browse only when NOT logged in */}
      {!user && (
        <Link to="/properties" style={{
          padding: '8px 20px', borderRadius: '8px', textDecoration: 'none',
          fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          🔍 Browse Properties
        </Link>
      )}

      {/* Right Side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {!user ? (
          <>
            <Link to="/login" style={{
              color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
              fontSize: '14px', fontWeight: '500', padding: '8px 16px',
              borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)'
            }}>Login</Link>
            <Link to="/register" style={{
              background: '#7c3aed', color: 'white', textDecoration: 'none',
              fontSize: '14px', fontWeight: '600', padding: '8px 20px', borderRadius: '8px'
            }}>Register</Link>
          </>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px', padding: '6px 12px',
                cursor: 'pointer', color: 'white', position: 'relative'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: '#7c3aed', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '13px', fontWeight: '700'
              }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>
                  {user.name?.split(' ')[0]}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
                  {user.role}
                </div>
              </div>
              {/* Badge — unread count */}
              {totalBadge > 0 && (
                <div style={{
                  position: 'absolute', top: '4px', right: '36px',
                  background: '#ef4444', color: 'white', borderRadius: '50%',
                  width: '16px', height: '16px', fontSize: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '700', border: '1px solid #0f172a'
                }}>
                  {totalBadge}
                </div>
              )}
              <span style={{ fontSize: '10px', opacity: 0.6 }}>
                {menuOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0,
                background: 'white', borderRadius: '12px', minWidth: '220px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                border: '1px solid #e5e7eb', overflow: 'hidden', zIndex: 1000
              }}>

                {/* User Info Header */}
                <div style={{
                  padding: '14px 16px', borderBottom: '1px solid #f3f4f6',
                  background: '#faf5ff'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      background: '#7c3aed', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: 'white'
                    }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                        {user.name}
                      </p>
                      <p style={{ fontSize: '11px', color: '#6b7280' }}>{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* ── USER LINKS ── */}
                {user.role === 'user' && (
                  <>
                    <DropdownItem
                      icon="📊" label="Dashboard"
                      onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}
                    />
                    <DropdownItem
                      icon="❤️" label="Saved Properties"
                      badge={savedCount}
                      onClick={() => { navigate('/dashboard', { state: { tab: 'saved' } }); setMenuOpen(false); }}
                    />
                    <DropdownItem
                      icon="💬" label="Messages"
                      badge={unreadMsg}
                      onClick={() => { navigate('/dashboard', { state: { tab: 'messages' } }); setMenuOpen(false); }}
                    />
                    <DropdownItem
                      icon="🔔" label="Notifications"
                      badge={unreadNotif}
                      onClick={() => { navigate('/dashboard', { state: { tab: 'notifications' } }); setMenuOpen(false); }}
                    />
                    <DropdownItem
                      icon="👤" label="Profile"
                      onClick={() => { navigate('/dashboard', { state: { tab: 'profile' } }); setMenuOpen(false); }}
                    />
                    <DropdownItem
                      icon="⚙️" label="Settings"
                      onClick={() => { navigate('/dashboard', { state: { tab: 'settings' } }); setMenuOpen(false); }}
                    />
                  </>
                )}

                {/* ── ADMIN LINKS — Same structure as user ── */}
                {user.role === 'admin' && (
                  <>
                    <DropdownItem
                      icon="📊" label="Admin Dashboard"
                      onClick={() => { navigate('/admin'); setMenuOpen(false); }}
                    />
                    <DropdownItem
                      icon="❤️" label="Saved Properties"
                      badge={savedCount}
                      onClick={() => { navigate('/admin', { state: { tab: 'saved' } }); setMenuOpen(false); }}
                    />
                    <DropdownItem
                      icon="💬" label="Messages"
                      badge={unreadMsg}
                      onClick={() => { navigate('/admin', { state: { tab: 'messages' } }); setMenuOpen(false); }}
                    />
                    <DropdownItem
                      icon="🔔" label="Notifications"
                      badge={unreadNotif}
                      onClick={() => { navigate('/admin', { state: { tab: 'notifications' } }); setMenuOpen(false); }}
                    />
                    <DropdownItem
                      icon="👤" label="Profile"
                      onClick={() => { navigate('/admin', { state: { tab: 'profile' } }); setMenuOpen(false); }}
                    />
                    <DropdownItem
                      icon="⚙️" label="Settings"
                      onClick={() => { navigate('/admin', { state: { tab: 'settings' } }); setMenuOpen(false); }}
                    />
                  </>
                )}

                {/* Logout */}
                <div style={{ borderTop: '1px solid #f3f4f6' }}>
                  <button onClick={handleLogout} style={{
                    width: '100%', padding: '11px 16px', border: 'none',
                    background: 'none', cursor: 'pointer', textAlign: 'left',
                    fontSize: '13px', color: '#dc2626', fontWeight: '500',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span>🚪</span> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

const DropdownItem = ({ icon, label, onClick, badge }) => (
  <button onClick={onClick} style={{
    width: '100%', padding: '10px 16px', border: 'none',
    background: 'none', cursor: 'pointer', textAlign: 'left',
    fontSize: '13px', color: '#374151',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between'
  }}
    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
    onMouseLeave={e => e.currentTarget.style.background = 'none'}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span>{icon}</span> {label}
    </div>
    {badge > 0 && (
      <span style={{
        background: '#7c3aed', color: 'white', borderRadius: '10px',
        fontSize: '11px', fontWeight: '700', padding: '1px 7px',
        minWidth: '20px', textAlign: 'center'
      }}>
        {badge}
      </span>
    )}
  </button>
);

export default Navbar;