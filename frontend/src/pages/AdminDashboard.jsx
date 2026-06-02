import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, bookingsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/bookings'),
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setBookings(bookingsRes.data.bookings);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggleUser = async (userId) => {
    if (!window.confirm('Toggle user status?')) return;
    try {
      await api.put(`/admin/users/${userId}/toggle`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed.');
    }
  };

  const getRoleBadge = (role) => {
    const map = { tenant: 'badge-blue', owner: 'badge-green', admin: 'badge-yellow' };
    return map[role] || 'badge-gray';
  };

  const getStatusBadge = (status) => {
    const map = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red', cancelled: 'badge-gray' };
    return map[status] || 'badge-gray';
  };

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: '4px' }}>⚙️ Admin Dashboard</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Welcome, {user?.name}! Manage the platform.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalUsers || 0}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#057a55' }}>{stats.totalProperties || 0}</div>
          <div className="stat-label">Total Properties</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#1a56db' }}>{stats.totalBookings || 0}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#c27803' }}>{stats.pendingBookings || 0}</div>
          <div className="stat-label">Pending Bookings</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        {[
          { key: 'stats', label: '📊 Overview' },
          { key: 'users', label: `👥 Users (${users.length})` },
          { key: 'bookings', label: `📋 Bookings (${bookings.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 24px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
              background: 'none', borderBottom: activeTab === tab.key ? '2px solid #1a56db' : '2px solid transparent',
              color: activeTab === tab.key ? '#1a56db' : '#6b7280', marginBottom: '-2px',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <div className="loading">Loading...</div> : (
        <>
          {/* Overview Tab */}
          {activeTab === 'stats' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="card">
                <h3 className="section-title">Users by Role</h3>
                {[
                  { role: 'tenant', label: 'Tenants', color: '#1a56db' },
                  { role: 'owner', label: 'Property Owners', color: '#057a55' },
                  { role: 'admin', label: 'Admins', color: '#c27803' },
                ].map(({ role, label, color }) => {
                  const count = users.filter(u => u.role === role).length;
                  const percent = users.length > 0 ? (count / users.length) * 100 : 0;
                  return (
                    <div key={role} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px', color: '#374151' }}>{label}</span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color }}>{count}</span>
                      </div>
                      <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '8px' }}>
                        <div style={{ background: color, height: '8px', borderRadius: '4px', width: `${percent}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="card">
                <h3 className="section-title">Bookings by Status</h3>
                {[
                  { status: 'pending', label: 'Pending', color: '#c27803' },
                  { status: 'approved', label: 'Approved', color: '#057a55' },
                  { status: 'rejected', label: 'Rejected', color: '#e02424' },
                  { status: 'cancelled', label: 'Cancelled', color: '#6b7280' },
                ].map(({ status, label, color }) => {
                  const count = bookings.filter(b => b.status === status).length;
                  const percent = bookings.length > 0 ? (count / bookings.length) * 100 : 0;
                  return (
                    <div key={status} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px', color: '#374151' }}>{label}</span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color }}>{count}</span>
                      </div>
                      <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '8px' }}>
                        <div style={{ background: color, height: '8px', borderRadius: '4px', width: `${percent}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="card">
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td><strong>{u.name}</strong></td>
                        <td style={{ color: '#6b7280', fontSize: '13px' }}>{u.email}</td>
                        <td><span className={`badge ${getRoleBadge(u.role)}`}>{u.role}</span></td>
                        <td style={{ color: '#6b7280', fontSize: '13px' }}>{u.phone || '—'}</td>
                        <td>
                          <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ color: '#6b7280', fontSize: '13px' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          {u._id !== user?.id && (
                            <button onClick={() => handleToggleUser(u._id)}
                              className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}>
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="card">
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Tenant</th>
                      <th>Owner</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td><strong>{booking.property?.title || 'N/A'}</strong></td>
                        <td>{booking.tenant?.name || 'N/A'}</td>
                        <td>{booking.owner?.name || 'N/A'}</td>
                        <td>{new Date(booking.preferredDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td style={{ color: '#6b7280', fontSize: '13px' }}>
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;