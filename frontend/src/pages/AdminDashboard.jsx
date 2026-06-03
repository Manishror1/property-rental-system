import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, bookingsRes, propsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/bookings'),
        api.get('/properties?status=available'),
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setBookings(bookingsRes.data.bookings);
      setProperties(propsRes.data.properties);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const pendingUsers = users.filter(u => !u.isActive).length;

  const sidebarItems = [
    { icon: '📊', label: 'Dashboard', onClick: () => setActiveTab('dashboard') },
    { icon: '👥', label: 'User Management', onClick: () => setActiveTab('users'), badge: pendingUsers, badgeColor: 'yellow' },
    { icon: '🏠', label: 'Property Management', onClick: () => setActiveTab('properties') },
    { icon: '📋', label: 'All Bookings', onClick: () => setActiveTab('bookings') },
    { icon: '👤', label: 'Profile', onClick: () => setActiveTab('profile') },
  ];

  const handleToggleUser = async (userId) => {
    if (!window.confirm('Toggle user status?')) return;
    try {
      await api.put(`/admin/users/${userId}/toggle`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed.');
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Delete this property?')) return;
    try {
      await api.delete(`/admin/properties/${propertyId}`);
      fetchData();
    } catch (error) {
      alert('Delete failed.');
    }
  };

  const getRoleBadge = (role) => ({ tenant: 'badge-blue', owner: 'badge-green', admin: 'badge-yellow' }[role] || 'badge-gray');
  const getStatusBadge = (status) => ({ pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red', cancelled: 'badge-gray' }[status] || 'badge-gray');

  return (
    <div className="dashboard-layout">
      <Sidebar items={sidebarItems} />
      <div className="dashboard-main">

        {/* Topbar */}
        <div className="dashboard-topbar">
          <div>
            <h1>
              {activeTab === 'dashboard' && 'Admin Dashboard'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'properties' && 'Property Management'}
              {activeTab === 'bookings' && 'All Bookings'}
              {activeTab === 'profile' && 'My Profile'}
            </h1>
            <p>Property Booking and Rental System</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '700' }}>
                {user?.name?.charAt(0)}
              </div>
              {user?.name}
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              <div className="stats-row">
                <div className="stat-box">
                  <div className="stat-box-info"><h3>Total Users</h3><div className="num">{stats.totalUsers || 0}</div></div>
                  <div className="stat-box-icon" style={{ background: '#e1effe' }}>👥</div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-info"><h3>Total Properties</h3><div className="num" style={{ color: '#057a55' }}>{stats.totalProperties || 0}</div></div>
                  <div className="stat-box-icon" style={{ background: '#def7ec' }}>🏠</div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-info"><h3>Active Bookings</h3><div className="num" style={{ color: '#1a56db' }}>{stats.totalBookings || 0}</div></div>
                  <div className="stat-box-icon" style={{ background: '#e1effe' }}>📋</div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-info"><h3>Pending Approvals</h3><div className="num" style={{ color: '#c27803' }}>{stats.pendingBookings || 0}</div></div>
                  <div className="stat-box-icon" style={{ background: '#fdf6b2' }}>⏳</div>
                </div>
              </div>

              {/* User Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 className="section-title" style={{ marginBottom: 0 }}>User Management</h2>
                    <span className="badge badge-yellow">{pendingUsers} pending</span>
                  </div>
                  {[
                    { role: 'tenant', label: 'Tenants', color: '#1a56db', bg: '#e1effe' },
                    { role: 'owner', label: 'Property Owners', color: '#057a55', bg: '#def7ec' },
                    { role: 'admin', label: 'Admins', color: '#c27803', bg: '#fdf6b2' },
                  ].map(({ role, label, color, bg }) => {
                    const count = users.filter(u => u.role === role).length;
                    return (
                      <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                          <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color, background: bg, padding: '2px 10px', borderRadius: '10px' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="card">
                  <h2 className="section-title">Booking Status</h2>
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
                          <div style={{ background: color, height: '6px', borderRadius: '4px', width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="section-title" style={{ marginBottom: 0 }}>User Management</h2>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>{users.length} users · {users.filter(u => u.isActive).length} active · {users.filter(u => !u.isActive).length} inactive</p>
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
                              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#e1effe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#1e429f' }}>
                                {u.name?.charAt(0)}
                              </div>
                              <strong>{u.name}</strong>
                            </div>
                          </td>
                          <td style={{ color: '#6b7280', fontSize: '13px' }}>{u.email}</td>
                          <td><span className={`badge ${getRoleBadge(u.role)}`}>{u.role}</span></td>
                          <td>
                            <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                              {u.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td style={{ color: '#6b7280', fontSize: '13px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
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

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="card">
              <h2 className="section-title">Property Management</h2>
              {loading ? <div className="loading">Loading...</div> :
                properties.length === 0 ? <div className="empty-state"><h3>No properties</h3></div> : (
                  <table>
                    <thead>
                      <tr><th>Property</th><th>Owner</th><th>Location</th><th>Rent</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {properties.map((p) => (
                        <tr key={p._id}>
                          <td><strong>{p.title}</strong></td>
                          <td style={{ color: '#6b7280', fontSize: '13px' }}>{p.owner?.name}</td>
                          <td style={{ color: '#6b7280' }}>📍 {p.city}</td>
                          <td><strong style={{ color: '#1a56db' }}>${p.rentPerWeek}/wk</strong></td>
                          <td><span className={`badge ${p.status === 'available' ? 'badge-green' : 'badge-gray'}`}>{p.status}</span></td>
                          <td>
                            <button onClick={() => handleDeleteProperty(p._id)} className="btn btn-danger btn-sm">🗑 Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="card">
              <h2 className="section-title">All Bookings</h2>
              {loading ? <div className="loading">Loading...</div> :
                bookings.length === 0 ? <div className="empty-state"><h3>No bookings</h3></div> : (
                  <table>
                    <thead>
                      <tr><th>Property</th><th>Tenant</th><th>Owner</th><th>Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b._id}>
                          <td><strong>{b.property?.title || 'N/A'}</strong></td>
                          <td>{b.tenant?.name}</td>
                          <td style={{ color: '#6b7280', fontSize: '13px' }}>{b.owner?.name}</td>
                          <td>{new Date(b.preferredDate).toLocaleDateString()}</td>
                          <td><span className={`badge ${getStatusBadge(b.status)}`}>{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card" style={{ maxWidth: '500px' }}>
              <h2 className="section-title">Admin Profile</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#c27803', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: 'white' }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                {[
                  { label: 'Full Name', value: user?.name },
                  { label: 'Email', value: user?.email },
                  { label: 'Role', value: user?.role },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '12px 16px', background: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>{label}</p>
                    <p style={{ fontSize: '14px', fontWeight: '500', textTransform: 'capitalize' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;