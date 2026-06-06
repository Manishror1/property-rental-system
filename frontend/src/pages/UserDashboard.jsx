import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToPush } from '../services/pushService';
import ProfileTab from '../components/ProfileTab';
import PropertyList from './PropertyList';
import EmbeddedPropertyDetail from '../components/EmbeddedPropertyDetail';
import ChatTab from '../components/ChatTab';
import SettingsTab from '../components/SettingsTab';
import PropertyCard from '../components/PropertyCard';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialTab = location.state?.tab || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [myProperties, setMyProperties] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState('');
  const [editingProperty, setEditingProperty] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [propertyForm, setPropertyForm] = useState({
    title: '', description: '', address: '', city: '',
    rentPerWeek: '', bedrooms: '', bathrooms: '',
    propertyType: 'house', amenities: '', status: 'available'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, propsRes, requestsRes, notifsRes, wishlistRes, msgRes] = await Promise.all([
        api.get('/bookings/my-bookings'),
        api.get('/properties/my-listings'),
        api.get('/bookings/requests'),
        api.get('/notifications'),
        api.get('/auth/wishlist'),
        api.get('/messages/unread-count'),
      ]);
      setMyBookings(bookingsRes.data.bookings);
      setMyProperties(propsRes.data.properties);
      setBookingRequests(requestsRes.data.bookings);
      setNotifications(notifsRes.data.notifications);
      setSavedProperties(wishlistRes.data.savedProperties || []);
      setUnreadMessages(msgRes.data.count || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab);
  }, [location.state]);

  // ✅ Auto re-subscribe on every app load
useEffect(() => {
  const autoSubscribe = async () => {
    try {
      // Only if permission already granted — don't ask again
      if (Notification.permission === 'granted') {
        const { subscribeToPush } = await import('../services/pushService');
        await subscribeToPush();
        console.log('[Dashboard] Push re-subscribed');
      }
    } catch (e) {
      console.log('[Dashboard] Auto subscribe failed:', e);
    }
  };
  autoSubscribe();
}, []); // Run once on mount

  const pendingRequests = bookingRequests.filter(b => b.status === 'pending').length;
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

const tabs = [
  { id: 'dashboard', label: '📊 Overview' },
  { id: 'my-bookings', label: `📋 My Bookings${myBookings.filter(b => b.status === 'pending').length > 0 ? ` (${myBookings.filter(b => b.status === 'pending').length})` : ''}` },
  { id: 'my-listings', label: '🏠 My Listings' },
  { id: 'requests', label: `📩 Requests${pendingRequests > 0 ? ` (${pendingRequests})` : ''}` },
  { id: 'browse', label: '🔍 Browse' },
];

  /** Enable push notifications — requests Windows permission */
const handleEnablePush = async () => {
  try {
    // Import push service
    const { subscribeToPush } = await import('../services/pushService');
    const success = await subscribeToPush();

    if (success) {
      alert('✅ Notifications enabled! You will now receive Windows notifications.');
      fetchData();
    } else {
      alert('❌ Please allow notifications in your browser settings.\n\nClick the 🔒 lock icon in address bar → Notifications → Allow');
    }
  } catch (error) {
    console.error('Enable push error:', error);
    alert('Failed to enable notifications. Please try again.');
  }
};

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/status`, { status: 'cancelled' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed.');
    }
  };

  const handleBookingAction = async (id, status) => {
    try {
      const note = status === 'approved' ? 'Approved! Please come on time.' : 'Sorry, not available.';
      await api.put(`/bookings/${id}/status`, { status, ownerNote: note });
      fetchData();
    } catch {
      alert('Action failed.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFormChange = (e) => {
    setPropertyForm({ ...propertyForm, [e.target.name]: e.target.value });
    setFormError('');
  };

  const resetForm = () => {
    setPropertyForm({
      title: '', description: '', address: '', city: '',
      rentPerWeek: '', bedrooms: '', bathrooms: '',
      propertyType: 'house', amenities: '', status: 'available'
    });
    setFormError('');
  };

  const handleSubmitProperty = async (e) => {
    e.preventDefault();
    const required = ['title', 'description', 'address', 'city', 'rentPerWeek', 'bedrooms', 'bathrooms'];
    for (const f of required) {
      if (!propertyForm[f]) { setFormError(`${f} is required`); return; }
    }
    try {
      const data = {
        ...propertyForm,
        rentPerWeek: Number(propertyForm.rentPerWeek),
        bedrooms: Number(propertyForm.bedrooms),
        bathrooms: Number(propertyForm.bathrooms),
        amenities: propertyForm.amenities
          ? propertyForm.amenities.split(',').map(a => a.trim()).filter(Boolean)
          : [],
      };
      if (editingProperty) {
        await api.put(`/properties/${editingProperty._id}`, data);
        setFormSuccess('Property updated!');
      } else {
        await api.post('/properties', data);
        setFormSuccess('Property listed!');
      }
      setEditingProperty(null);
      resetForm();
      fetchData();
      setActiveTab('my-listings');
    } catch (error) {
      setFormError(error.response?.data?.message || 'Failed.');
    }
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setPropertyForm({
      title: property.title,
      description: property.description,
      address: property.address,
      city: property.city,
      rentPerWeek: property.rentPerWeek,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      propertyType: property.propertyType,
      amenities: property.amenities?.join(', ') || '',
      status: property.status,
    });
    setActiveTab('add-property');
  };

  const handleDeleteProperty = async (id) => {
    if (!window.confirm('Delete this property?')) return;
    try {
      await api.delete(`/properties/${id}`);
      setFormSuccess('Property deleted!');
      fetchData();
    } catch { alert('Delete failed.'); }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'badge-yellow', approved: 'badge-green',
      rejected: 'badge-red', cancelled: 'badge-gray',
      available: 'badge-green', rented: 'badge-red', unavailable: 'badge-gray'
    };
    return map[status] || 'badge-gray';
  };

  const savedPropertyIds = savedProperties.map(p =>
    typeof p === 'object' ? p._id?.toString() : p?.toString()
  );

  return (
    <div style={{ background: '#f3f4f6', minHeight: 'calc(100vh - 64px)' }}>

      {/* ── DASHBOARD HEADER ──────────────────────────────── */}
      <div style={{ background: '#0f172a', padding: '20px 32px 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          {/* Title + Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              {/* ✅ CORRECT PLACE — h1 me sab tab titles */}
              <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '2px' }}>
                {activeTab === 'dashboard' && `Welcome back, ${user?.name}! 👋`}
                {activeTab === 'my-bookings' && 'My Bookings'}
                {activeTab === 'my-listings' && 'My Property Listings'}
                {activeTab === 'add-property' && (editingProperty ? 'Edit Property' : 'List New Property')}
                {activeTab === 'requests' && 'Booking Requests'}
                {activeTab === 'browse' && 'Browse Properties'}
                {activeTab === 'saved' && '❤️ Saved Properties'}
                {activeTab === 'messages' && '💬 Messages'}
                {activeTab === 'notifications' && 'Notifications'}
                {activeTab === 'profile' && 'My Profile'}
                {activeTab === 'settings' && '⚙️ Settings'}
              </h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                {activeTab === 'dashboard'
                  ? 'Manage your properties and bookings'
                  : 'Property Booking and Rental System'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleEnablePush} style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: 'white', padding: '8px 16px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '13px'
              }}>
                🔔 Enable Notifications
              </button>
              <button
                onClick={() => { setActiveTab('add-property'); setEditingProperty(null); resetForm(); }}
                style={{
                  background: '#7c3aed', border: 'none', color: 'white',
                  padding: '8px 16px', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                }}>
                + List Property
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
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
                }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PAGE CONTENT ──────────────────────────────────── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 32px' }}>

        {pushStatus && (
          <div className={`alert ${pushStatus.includes('✅') ? 'alert-success' : 'alert-error'}`}
            style={{ marginBottom: '16px' }}>
            {pushStatus}
          </div>
        )}

        {formSuccess && (
          <div className="alert alert-success" style={{ marginBottom: '16px' }}>
            {formSuccess}
          </div>
        )}

        {/* ── OVERVIEW TAB ────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <>
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-box-info"><h3>My Bookings</h3><div className="num">{myBookings.length}</div></div>
                <div className="stat-box-icon" style={{ background: '#ede9fe' }}>📋</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-info"><h3>My Listings</h3><div className="num" style={{ color: '#057a55' }}>{myProperties.length}</div></div>
                <div className="stat-box-icon" style={{ background: '#dcfce7' }}>🏠</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-info"><h3>Pending Requests</h3><div className="num" style={{ color: '#c27803' }}>{pendingRequests}</div></div>
                <div className="stat-box-icon" style={{ background: '#fdf6b2' }}>📩</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-info"><h3>Unread</h3><div className="num" style={{ color: '#7c3aed' }}>{unreadNotifs}</div></div>
                <div className="stat-box-icon" style={{ background: '#ede9fe' }}>🔔</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h2 className="section-title" style={{ marginBottom: 0 }}>Recent Bookings</h2>
                  <button onClick={() => setActiveTab('my-bookings')} className="btn btn-sm"
                    style={{ background: '#ede9fe', color: '#5b21b6' }}>View All</button>
                </div>
                {loading ? <div className="loading">Loading...</div> :
                  myBookings.length === 0 ? (
                    <div className="empty-state" style={{ padding: '20px' }}>
                      <p>No bookings yet</p>
                      <button onClick={() => setActiveTab('browse')}
                        className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                        Browse Properties
                      </button>
                    </div>
                  ) : myBookings.slice(0, 4).map((b) => (
                    <div key={b._id} style={{
                      padding: '10px 0', borderBottom: '1px solid #f1f5f9',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600' }}>{b.property?.title}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>
                          {b.property?.city} · ${b.property?.rentPerWeek}/wk
                        </p>
                      </div>
                      <span className={`badge ${getStatusBadge(b.status)}`}>{b.status}</span>
                    </div>
                  ))}
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h2 className="section-title" style={{ marginBottom: 0 }}>Incoming Requests</h2>
                  <span className="badge badge-yellow">{pendingRequests} pending</span>
                </div>
                {loading ? <div className="loading">Loading...</div> :
                  bookingRequests.filter(b => b.status === 'pending').length === 0 ? (
                    <div className="empty-state" style={{ padding: '20px' }}><p>No pending requests</p></div>
                  ) : bookingRequests.filter(b => b.status === 'pending').slice(0, 4).map((b) => (
                    <div key={b._id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '600' }}>{b.tenant?.name}</p>
                          <p style={{ fontSize: '12px', color: '#6b7280' }}>{b.property?.title}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => handleBookingAction(b._id, 'approved')}
                            className="btn btn-success btn-sm">✓</button>
                          <button onClick={() => handleBookingAction(b._id, 'rejected')}
                            className="btn btn-danger btn-sm">✗</button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
              <h2 className="section-title" style={{ marginBottom: '14px' }}>My Properties Overview</h2>
              <div style={{ display: 'flex', gap: '16px' }}>
                {[
                  { label: 'Available', count: myProperties.filter(p => p.status === 'available').length, color: '#057a55', bg: '#dcfce7' },
                  { label: 'Rented', count: myProperties.filter(p => p.status === 'rented').length, color: '#dc2626', bg: '#fee2e2' },
                  { label: 'Unavailable', count: myProperties.filter(p => p.status === 'unavailable').length, color: '#6b7280', bg: '#f3f4f6' },
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

        {/* ── MY BOOKINGS TAB ─────────────────────────────── */}
        {activeTab === 'my-bookings' && (
          <div className="card">
            <h2 className="section-title">Properties I've Booked</h2>
            {loading ? <div className="loading">Loading...</div> :
              myBookings.length === 0 ? (
                <div className="empty-state">
                  <h3>No bookings yet</h3>
                  <button onClick={() => setActiveTab('browse')}
                    className="btn btn-primary" style={{ marginTop: '12px' }}>
                    Browse Properties
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Property</th><th>City</th><th>Rent/Week</th>
                        <th>Date</th><th>Status</th><th>Owner Note</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myBookings.map((b) => (
                        <tr key={b._id}>
                          <td><strong>{b.property?.title || 'N/A'}</strong></td>
                          <td style={{ color: '#6b7280' }}>{b.property?.city}</td>
                          <td><strong style={{ color: '#7c3aed' }}>${b.property?.rentPerWeek}/wk</strong></td>
                          <td>{new Date(b.preferredDate).toLocaleDateString()}</td>
                          <td><span className={`badge ${getStatusBadge(b.status)}`}>{b.status}</span></td>
                          <td style={{ fontSize: '13px', color: '#6b7280' }}>{b.ownerNote || '—'}</td>
                          <td>
                            {b.status === 'pending' && (
                              <button onClick={() => handleCancelBooking(b._id)}
                                className="btn btn-danger btn-sm">Cancel</button>
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

        {/* ── MY LISTINGS TAB ─────────────────────────────── */}
        {activeTab === 'my-listings' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: '2px' }}>My Property Listings</h2>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                  {myProperties.length} properties · {myProperties.filter(p => p.status === 'available').length} available
                </p>
              </div>
              <button
                onClick={() => { setActiveTab('add-property'); setEditingProperty(null); resetForm(); }}
                className="btn btn-primary btn-sm">+ Add Property</button>
            </div>
            {loading ? <div className="loading">Loading...</div> :
              myProperties.length === 0 ? (
                <div className="empty-state">
                  <h3>No listings yet</h3>
                  <button onClick={() => { setActiveTab('add-property'); setEditingProperty(null); }}
                    className="btn btn-primary" style={{ marginTop: '12px' }}>
                    List First Property
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Property</th><th>Location</th><th>Rent/Week</th>
                        <th>Beds/Bath</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myProperties.map((p) => (
                        <tr key={p._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '32px', height: '32px', background: '#ede9fe',
                                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>🏠</div>
                              <div>
                                <strong style={{ fontSize: '13px' }}>{p.title}</strong>
                                <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'capitalize' }}>{p.propertyType}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: '#6b7280', fontSize: '13px' }}>📍 {p.city}</td>
                          <td><strong style={{ color: '#7c3aed' }}>${p.rentPerWeek}/wk</strong></td>
                          <td style={{ fontSize: '13px', color: '#6b7280' }}>{p.bedrooms} bed · {p.bathrooms} bath</td>
                          <td><span className={`badge ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleEditProperty(p)}
                                className="btn btn-sm" style={{ background: '#ede9fe', color: '#5b21b6' }}>
                                ✏ Edit
                              </button>
                              <button onClick={() => handleDeleteProperty(p._id)}
                                className="btn btn-danger btn-sm">🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {/* ── ADD / EDIT PROPERTY TAB ──────────────────────── */}
        {activeTab === 'add-property' && (
          <div className="card" style={{ maxWidth: '700px' }}>
            <h2 className="section-title">
              {editingProperty ? 'Edit Property' : 'List New Property'}
            </h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSubmitProperty}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Title *</label>
                  <input type="text" name="title" value={propertyForm.title}
                    onChange={handleFormChange} placeholder="e.g. Modern 3 Bedroom House" />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input type="text" name="city" value={propertyForm.city}
                    onChange={handleFormChange} placeholder="e.g. Auckland" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Address *</label>
                  <input type="text" name="address" value={propertyForm.address}
                    onChange={handleFormChange} placeholder="Full address" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Description *</label>
                  <textarea name="description" rows="3" value={propertyForm.description}
                    onChange={handleFormChange} style={{ resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label>Rent Per Week ($) *</label>
                  <input type="number" name="rentPerWeek" value={propertyForm.rentPerWeek}
                    onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Property Type</label>
                  <select name="propertyType" value={propertyForm.propertyType} onChange={handleFormChange}>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="studio">Studio</option>
                    <option value="townhouse">Townhouse</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Bedrooms *</label>
                  <input type="number" name="bedrooms" value={propertyForm.bedrooms}
                    onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Bathrooms *</label>
                  <input type="number" name="bathrooms" value={propertyForm.bathrooms}
                    onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={propertyForm.status} onChange={handleFormChange}>
                    <option value="available">Available</option>
                    <option value="rented">Rented</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amenities (comma separated)</label>
                  <input type="text" name="amenities" value={propertyForm.amenities}
                    onChange={handleFormChange} placeholder="WiFi, Parking, Dishwasher" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary">
                  {editingProperty ? 'Update' : 'List Property'}
                </button>
                <button type="button" className="btn"
                  onClick={() => { setActiveTab('my-listings'); resetForm(); setEditingProperty(null); }}
                  style={{ background: '#f3f4f6', color: '#374151' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── REQUESTS TAB ────────────────────────────────── */}
        {activeTab === 'requests' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Requests for My Properties</h2>
              <span className="badge badge-yellow">{pendingRequests} pending</span>
            </div>
            {loading ? <div className="loading">Loading...</div> :
              bookingRequests.length === 0 ? (
                <div className="empty-state"><h3>No requests yet</h3></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>From</th><th>Property</th><th>Date</th>
                        <th>Message</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingRequests.map((b) => (
                        <tr key={b._id}>
                          <td>
                            <div>
                              <p style={{ fontWeight: '600', fontSize: '13px' }}>{b.tenant?.name}</p>
                              <p style={{ fontSize: '12px', color: '#6b7280' }}>{b.tenant?.email}</p>
                            </div>
                          </td>
                          <td><strong style={{ fontSize: '13px' }}>{b.property?.title}</strong></td>
                          <td style={{ fontSize: '13px' }}>{new Date(b.preferredDate).toLocaleDateString()}</td>
                          <td style={{ fontSize: '13px', color: '#6b7280', maxWidth: '150px' }}>
                            {b.message || '—'}
                          </td>
                          <td><span className={`badge ${getStatusBadge(b.status)}`}>{b.status}</span></td>
                          <td>
                            {b.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => handleBookingAction(b._id, 'approved')}
                                  className="btn btn-success btn-sm">✓ Approve</button>
                                <button onClick={() => handleBookingAction(b._id, 'rejected')}
                                  className="btn btn-danger btn-sm">✗ Reject</button>
                              </div>
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

        {/* ── BROWSE TAB ──────────────────────────────────── */}
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

        {/* ── SAVED PROPERTIES TAB ────────────────────────── */}
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

        {/* ── MESSAGES TAB ────────────────────────────────── */}
        {activeTab === 'messages' && (
          <ChatTab />
        )}

{/* ── NOTIFICATIONS TAB ───────────────────────────── */}
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
        <p style={{ color: '#6b7280', marginTop: '8px' }}>
          You'll be notified about bookings, messages, and account activity.
        </p>
      </div>
    ) : (
      notifications.map((n) => {
        // Type based icon
        const icons = {
          booking_request: '🏠',
          booking_approved: '✅',
          booking_rejected: '❌',
          booking_cancelled: '🚫',
          security: '🔒',
          account: '👤',
          message: '💬',
          welcome: '🎉',
          test: '🧪',
          general: '🔔'
        };
        const icon = icons[n.type] || '🔔';

        return (
          <div key={n._id} style={{
            display: 'flex', gap: '12px', padding: '14px',
            borderRadius: '10px', marginBottom: '8px',
            background: n.isRead ? '#f9fafb' : '#faf5ff',
            border: `1px solid ${n.isRead ? '#e5e7eb' : '#ddd6fe'}`,
            transition: 'all 0.15s'
          }}>
            {/* Icon */}
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: n.isRead ? '#f3f4f6' : '#ede9fe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', flexShrink: 0
            }}>
              {icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    {!n.isRead && (
                      <div style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: '#7c3aed', flexShrink: 0
                      }} />
                    )}
                    <p style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>
                      {n.title}
                    </p>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.5' }}>
                    {n.body}
                  </p>
                </div>
                <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                  {new Date(n.createdAt).toLocaleDateString('en-NZ', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        );
      })
    )}
  </div>
)}

        {/* ── PROFILE TAB ─────────────────────────────────── */}
        {activeTab === 'profile' && (
          <ProfileTab user={user} onUpdate={fetchData} />
        )}

        {/* ── SETTINGS TAB ────────────────────────────────── */}
        {activeTab === 'settings' && (
          <SettingsTab user={user} />
        )}

      </div>
    </div>
  );
};

export default UserDashboard;