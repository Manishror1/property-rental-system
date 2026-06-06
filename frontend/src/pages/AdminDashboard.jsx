import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ProfileTab from '../components/ProfileTab';
import SettingsTab from '../components/SettingsTab';
import PropertyList from './PropertyList';
import EmbeddedPropertyDetail from '../components/EmbeddedPropertyDetail';
import ChatTab from '../components/ChatTab';
import PropertyCard from '../components/PropertyCard';

const AdminDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const initialTab = location.state?.tab || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, bookingsRes, notifsRes, wishlistRes, msgRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/bookings'),
        api.get('/notifications'),
        api.get('/auth/wishlist'),
        api.get('/messages/unread-count'),
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setBookings(bookingsRes.data.bookings);
      setNotifications(notifsRes.data.notifications);
      setSavedProperties(wishlistRes.data.savedProperties || []);
      setUnreadMessages(msgRes.data.count || 0);

      const [availRes, rentedRes, unavailRes] = await Promise.all([
        api.get('/properties?status=available'),
        api.get('/properties?status=rented'),
        api.get('/properties?status=unavailable'),
      ]);
      setProperties([
        ...availRes.data.properties,
        ...rentedRes.data.properties,
        ...unavailRes.data.properties,
      ]);
    } catch (error) {
      console.error('Admin fetchData error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const pendingUsers = users.filter(u => !u.isActive).length;
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const savedPropertyIds = savedProperties.map(p =>
    typeof p === 'object' ? p._id?.toString() : p?.toString()
  );

  const tabs = [
    { id: 'dashboard', label: '📊 Overview' },
    { id: 'users', label: `👥 Users${pendingUsers > 0 ? ` (${pendingUsers})` : ''}` },
    { id: 'properties', label: `🏠 Properties (${properties.length})` },
    { id: 'bookings', label: `📋 Bookings (${bookings.length})` },
    { id: 'browse', label: '🔍 Browse' },
  ];

  const handleToggleUser = async (userId) => {
    if (!window.confirm('Toggle this user\'s status?')) return;
    try {
      await api.put(`/admin/users/${userId}/toggle`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed.');
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Permanently delete this property?')) return;
    try {
      await api.delete(`/admin/properties/${propertyId}`);
      fetchData();
    } catch (error) {
      alert('Delete failed.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchData();
    } catch (error) {
      console.error('Mark all read failed:', error);
    }
  };

  const getRoleBadge = (role) => {
    const map = { user: 'badge-blue', admin: 'badge-yellow' };
    return map[role] || 'badge-gray';
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'badge-yellow', approved: 'badge-green',
      rejected: 'badge-red', cancelled: 'badge-gray',
      available: 'badge-green', rented: 'badge-red', unavailable: 'badge-gray',
    };
    return map[status] || 'badge-gray';
  };

  const getNotifIcon = (type) => {
    const icons = {
      booking_request: '🏠', booking_approved: '✅',
      booking_rejected: '❌', booking_cancelled: '🚫',
      security: '🔒', account: '👤',
      message: '💬', welcome: '🎉',
      test: '🧪', general: '🔔'
    };
    return icons[type] || '🔔';
  };

  return (
    <div style={{ background: '#f3f4f6', minHeight: 'calc(100vh - 64px)' }}>

      {/* Admin Header */}
      <div style={{ background: '#0f172a', padding: '20px 32px 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '2px' }}>
                {activeTab === 'dashboard' && '⚙️ Admin Dashboard'}
                {activeTab === 'users' && '👥 User Management'}
                {activeTab === 'properties' && '🏠 Property Management'}
                {activeTab === 'bookings' && '📋 All Bookings'}
                {activeTab === 'browse' && '🔍 Browse Properties'}
                {activeTab === 'saved' && '❤️ Saved Properties'}
                {activeTab === 'messages' && '💬 Messages'}
                {activeTab === 'notifications' && '🔔 Notifications'}
                {activeTab === 'profile' && '👤 Admin Profile'}
                {activeTab === 'settings' && '⚙️ Settings'}
              </h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                Property Booking and Rental System
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedPropertyId(null); }}
                style={{
                  padding: '10px 18px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '500', borderRadius: '8px 8px 0 0',
                  background: activeTab === tab.id ? '#f3f4f6' : 'transparent',
                  color: activeTab === tab.id ? '#7c3aed' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.15s', whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 32px' }}>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-box-info"><h3>Total Users</h3>
                  <div className="num">{stats.totalUsers || 0}</div></div>
                <div className="stat-box-icon" style={{ background: '#ede9fe' }}>👥</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-info"><h3>Total Properties</h3>
                  <div className="num" style={{ color: '#057a55' }}>{stats.totalProperties || 0}</div></div>
                <div className="stat-box-icon" style={{ background: '#dcfce7' }}>🏠</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-info"><h3>Total Bookings</h3>
                  <div className="num" style={{ color: '#7c3aed' }}>{stats.totalBookings || 0}</div></div>
                <div className="stat-box-icon" style={{ background: '#ede9fe' }}>📋</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-info"><h3>Pending Bookings</h3>
                  <div className="num" style={{ color: '#c27803' }}>{stats.pendingBookings || 0}</div></div>
                <div className="stat-box-icon" style={{ background: '#fdf6b2' }}>⏳</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 className="section-title" style={{ marginBottom: 0 }}>Users by Role</h2>
                  {pendingUsers > 0 && <span className="badge badge-yellow">{pendingUsers} suspended</span>}
                </div>
                {[
                  { role: 'user', label: 'Regular Users', color: '#7c3aed', bg: '#ede9fe' },
                  { role: 'admin', label: 'Administrators', color: '#c27803', bg: '#fdf6b2' },
                ].map(({ role, label, color, bg }) => {
                  const count = users.filter(u => u.role === role).length;
                  const percent = users.length > 0 ? (count / users.length) * 100 : 0;
                  return (
                    <div key={role} style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                          <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color, background: bg, padding: '2px 10px', borderRadius: '10px' }}>
                          {count}
                        </span>
                      </div>
                      <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '6px' }}>
                        <div style={{ background: color, height: '6px', borderRadius: '4px', width: `${percent}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#057a55' }}>✅ Active: {users.filter(u => u.isActive).length}</span>
                    <span style={{ color: '#dc2626' }}>🚫 Suspended: {users.filter(u => !u.isActive).length}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="section-title">Booking Status Overview</h2>
                {[
                  { status: 'pending', label: 'Pending', color: '#c27803' },
                  { status: 'approved', label: 'Approved', color: '#057a55' },
                  { status: 'rejected', label: 'Rejected', color: '#e02424' },
                  { status: 'cancelled', label: 'Cancelled', color: '#6b7280' },
                ].map(({ status, label, color }) => {
                  const count = bookings.filter(b => b.status === status).length;
                  const percent = bookings.length > 0 ? (count / bookings.length) * 100 : 0;
                  return (
                    <div key={status} style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color }}>{count}</span>
                      </div>
                      <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '6px' }}>
                        <div style={{ background: color, height: '6px', borderRadius: '4px', width: `${percent}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
              <h2 className="section-title" style={{ marginBottom: '14px' }}>Properties Overview</h2>
              <div style={{ display: 'flex', gap: '16px' }}>
                {[
                  { label: 'Available', count: properties.filter(p => p.status === 'available').length, color: '#057a55', bg: '#dcfce7' },
                  { label: 'Rented', count: properties.filter(p => p.status === 'rented').length, color: '#dc2626', bg: '#fee2e2' },
                  { label: 'Unavailable', count: properties.filter(p => p.status === 'unavailable').length, color: '#6b7280', bg: '#f3f4f6' },
                  { label: 'Total', count: properties.length, color: '#7c3aed', bg: '#ede9fe' },
                ].map(({ label, count, color, bg }) => (
                  <div key={label} style={{ flex: 1, padding: '14px', background: bg, borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '700', color }}>{count}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: '2px' }}>User Management</h2>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                  {users.length} total · {users.filter(u => u.isActive).length} active · {users.filter(u => !u.isActive).length} suspended
                </p>
              </div>
            </div>
            {loading ? <div className="loading">Loading...</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '30px', height: '30px', borderRadius: '50%',
                              background: u.role === 'admin' ? '#fdf6b2' : '#ede9fe',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', fontWeight: '700',
                              color: u.role === 'admin' ? '#92400e' : '#5b21b6'
                            }}>
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <strong style={{ fontSize: '13px' }}>{u.name}</strong>
                          </div>
                        </td>
                        <td style={{ color: '#6b7280', fontSize: '13px' }}>{u.email}</td>
                        <td><span className={`badge ${getRoleBadge(u.role)}`}>{u.role}</span></td>
                        <td>
                          <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                            {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td style={{ color: '#6b7280', fontSize: '13px' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          {u._id !== user?.id && (
                            <button onClick={() => handleToggleUser(u._id)}
                              className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}>
                              {u.isActive ? '✕ Suspend' : '✓ Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PROPERTIES TAB */}
        {activeTab === 'properties' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: '2px' }}>Property Management</h2>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                  {properties.length} total · {properties.filter(p => p.status === 'available').length} available · {properties.filter(p => p.status === 'rented').length} rented
                </p>
              </div>
            </div>
            {loading ? <div className="loading">Loading...</div> :
              properties.length === 0 ? (
                <div className="empty-state"><h3>No properties listed</h3></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr><th>Property</th><th>Owner</th><th>Location</th><th>Rent/Week</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {properties.map((p) => (
                        <tr key={p._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '32px', height: '32px', background: '#ede9fe',
                                borderRadius: '8px', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '14px', flexShrink: 0
                              }}>🏠</div>
                              <div>
                                <strong style={{ fontSize: '13px' }}>{p.title}</strong>
                                <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'capitalize' }}>{p.propertyType}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '13px' }}>
                            <p style={{ fontWeight: '500' }}>{p.owner?.name}</p>
                            <p style={{ fontSize: '11px', color: '#9ca3af' }}>{p.owner?.email}</p>
                          </td>
                          <td style={{ color: '#6b7280', fontSize: '13px' }}>📍 {p.city}</td>
                          <td><strong style={{ color: '#7c3aed' }}>${p.rentPerWeek}/wk</strong></td>
                          <td><span className={`badge ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                          <td>
                            <button onClick={() => handleDeleteProperty(p._id)}
                              className="btn btn-danger btn-sm">🗑 Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="card">
            <div style={{ marginBottom: '16px' }}>
              <h2 className="section-title" style={{ marginBottom: '2px' }}>All Bookings</h2>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>{bookings.length} total bookings</p>
            </div>
            {loading ? <div className="loading">Loading...</div> :
              bookings.length === 0 ? (
                <div className="empty-state"><h3>No bookings yet</h3></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr><th>Property</th><th>Tenant</th><th>Owner</th><th>Preferred Date</th><th>Status</th><th>Created</th></tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b._id}>
                          <td><strong style={{ fontSize: '13px' }}>{b.property?.title || 'N/A'}</strong></td>
                          <td style={{ fontSize: '13px' }}>
                            <p style={{ fontWeight: '500' }}>{b.tenant?.name}</p>
                            <p style={{ fontSize: '11px', color: '#9ca3af' }}>{b.tenant?.email}</p>
                          </td>
                          <td style={{ fontSize: '13px', color: '#6b7280' }}>{b.owner?.name}</td>
                          <td style={{ fontSize: '13px' }}>{new Date(b.preferredDate).toLocaleDateString()}</td>
                          <td><span className={`badge ${getStatusBadge(b.status)}`}>{b.status}</span></td>
                          <td style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {new Date(b.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {/* BROWSE TAB */}
        {activeTab === 'browse' && (
          selectedPropertyId ? (
            <EmbeddedPropertyDetail
              propertyId={selectedPropertyId}
              onBack={() => setSelectedPropertyId(null)}
            />
          ) : (
            <PropertyList
              embedded={true}
              onViewProperty={(property) => setSelectedPropertyId(property._id)}
              savedIds={savedPropertyIds}
            />
          )
        )}

        {/* SAVED PROPERTIES TAB */}
        {activeTab === 'saved' && (
          <div>
            {savedProperties.length === 0 ? (
              <div className="empty-state" style={{ padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤍</div>
                <h3>No saved properties yet</h3>
                <p style={{ color: '#6b7280', marginTop: '8px' }}>
                  Click the ❤️ icon on any property to save it here.
                </p>
                <button onClick={() => setActiveTab('browse')}
                  className="btn btn-primary" style={{ marginTop: '16px' }}>
                  Browse Properties
                </button>
              </div>
            ) : (
              <>
                <p style={{ marginBottom: '16px', color: '#6b7280', fontSize: '14px' }}>
                  {savedProperties.length} saved {savedProperties.length === 1 ? 'property' : 'properties'}
                </p>
                <div className="grid-3">
                  {savedProperties.map((property) => (
                    typeof property === 'object' && property._id ? (
                      <PropertyCard
                        key={property._id}
                        property={property}
                        savedIds={savedPropertyIds}
                        onViewDetails={(p) => {
                          setSelectedPropertyId(p._id);
                          setActiveTab('browse');
                        }}
                      />
                    ) : null
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <ChatTab />
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: '2px' }}>Notifications</h2>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                  {unreadNotifs} unread · {notifications.length} total
                </p>
              </div>
              {unreadNotifs > 0 && (
                <button onClick={handleMarkAllRead} className="btn btn-sm"
                  style={{ background: '#ede9fe', color: '#5b21b6' }}>
                  ✓ Mark All Read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
                <h3>No notifications yet</h3>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n._id} style={{
                  display: 'flex', gap: '12px', padding: '14px',
                  borderRadius: '10px', marginBottom: '8px',
                  background: n.isRead ? '#f9fafb' : '#faf5ff',
                  border: `1px solid ${n.isRead ? '#e5e7eb' : '#ddd6fe'}`,
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: n.isRead ? '#f3f4f6' : '#ede9fe',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '18px', flexShrink: 0
                  }}>
                    {getNotifIcon(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          {!n.isRead && (
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7c3aed' }} />
                          )}
                          <p style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{n.title}</p>
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.5' }}>{n.body}</p>
                      </div>
                      <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                        {new Date(n.createdAt).toLocaleDateString('en-NZ', {
                          day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <ProfileTab user={user} onUpdate={fetchData} />
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <SettingsTab user={user} />
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;