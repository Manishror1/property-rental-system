import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToPush } from '../services/pushService';

const TenantDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data.bookings);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'cancelled' });
      fetchBookings();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel.');
    }
  };

  const handleEnablePush = async () => {
    setPushStatus('Enabling...');
    try {
      await subscribeToPush();
      setPushStatus('✅ Push notifications enabled!');
    } catch {
      setPushStatus('❌ Failed to enable notifications.');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'badge-yellow',
      approved: 'badge-green',
      rejected: 'badge-red',
      cancelled: 'badge-gray',
    };
    return map[status] || 'badge-gray';
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
  };

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '4px' }}>👋 Welcome, {user?.name}!</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Manage your property booking requests</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleEnablePush} className="btn btn-primary btn-sm">
            🔔 Enable Notifications
          </button>
          <a href="/properties" className="btn btn-success btn-sm">
            🔍 Browse Properties
          </a>
        </div>
      </div>

      {pushStatus && (
        <div className={`alert ${pushStatus.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {pushStatus}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#c27803' }}>{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#057a55' }}>{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#e02424' }}>{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card">
        <h2 className="section-title">My Booking Requests</h2>

        {loading ? (
          <div className="loading">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <h3>No bookings yet</h3>
            <p>Browse properties and send a booking request!</p>
            <a href="/properties" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
              Browse Properties
            </a>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Location</th>
                  <th>Rent/Week</th>
                  <th>Preferred Date</th>
                  <th>Status</th>
                  <th>Owner Note</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <strong>{booking.property?.title || 'N/A'}</strong>
                    </td>
                    <td style={{ color: '#6b7280' }}>
                      {booking.property?.city || 'N/A'}
                    </td>
                    <td>
                      <strong style={{ color: '#1a56db' }}>
                        ${booking.property?.rentPerWeek}/wk
                      </strong>
                    </td>
                    <td>
                      {new Date(booking.preferredDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td style={{ color: '#6b7280', fontSize: '13px' }}>
                      {booking.ownerNote || '—'}
                    </td>
                    <td>
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="btn btn-danger btn-sm"
                        >
                          Cancel
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
    </div>
  );
};

export default TenantDashboard;