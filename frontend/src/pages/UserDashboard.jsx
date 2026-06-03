import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToPush } from '../services/pushService';
import Sidebar from '../components/Sidebar';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [myBookings, setMyBookings] = useState([]);
  const [myProperties, setMyProperties] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
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
      const [bookingsRes, propsRes, requestsRes, notifsRes] = await Promise.all([
        api.get('/bookings/my-bookings'),
        api.get('/properties/my-listings'),
        api.get('/bookings/requests'),
        api.get('/notifications'),
      ]);
      setMyBookings(bookingsRes.data.bookings);
      setMyProperties(propsRes.data.properties);
      setBookingRequests(requestsRes.data.bookings);
      setNotifications(notifsRes.data.notifications);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const pendingRequests = bookingRequests.filter(b => b.status === 'pending').length;
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const sidebarItems = [
    { icon: '📊', label: 'Dashboard', onClick: () => setActiveTab('dashboard') },
    { icon: '🔍', label: 'Browse Properties', onClick: () => navigate('/properties') },
    { icon: '📋', label: 'My Bookings', onClick: () => setActiveTab('my-bookings'), badge: myBookings.filter(b => b.status === 'pending').length, badgeColor: 'yellow' },
    { icon: '🏠', label: 'My Listings', onClick: () => setActiveTab('my-listings') },
    { icon: '📩', label: 'Booking Requests', onClick: () => setActiveTab('requests'), badge: pendingRequests, badgeColor: 'yellow' },
    { icon: '🔔', label: 'Notifications', onClick: () => setActiveTab('notifications'), badge: unreadNotifs },
    { icon: '👤', label: 'Profile', onClick: () => setActiveTab('profile') },
  ];

  const handleEnablePush = async () => {
    setPushStatus('Enabling...');
    try {
      await subscribeToPush();
      setPushStatus('✅ Notifications enabled!');
    } catch {
      setPushStatus('❌ Failed to enable.');
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
      const note = status === 'approved'
        ? 'Approved! Please come on time.'
        : 'Sorry, not available at this time.';
      await api.put(`/bookings/${id}/status`, { status, ownerNote: note });
      fetchData();
    } catch (error) {
      alert('Action failed.');
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
      if (!propertyForm[f]) {
        setFormError(`${f} is required`);
        return;
      }
    }
    try {
      const data = {
        ...propertyForm,
        rentPerWeek: Number(propertyForm.rentPerWeek),
        bedrooms: Number(propertyForm.bedrooms),
        bathrooms: Number(propertyForm.bathrooms),
        amenities: propertyForm.amenities
          ? propertyForm.amenities.split(',').map(a => a.trim())
          : [],
      };

      if (editingProperty) {
        await api.put(`/properties/${editingProperty._id}`, data);
        setFormSuccess('Property updated successfully!');
      } else {
        await api.post('/properties', data);
        setFormSuccess('Property listed successfully!');
      }

      setEditingProperty(null);
      resetForm();
      fetchData();
      setActiveTab('my-listings');
    } catch (error) {
      setFormError(error.response?.data?.message || 'Failed to save.');
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
      fetchData();
      setFormSuccess('Property deleted!');
    } catch {
      alert('Delete failed.');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'badge-yellow',
      approved: 'badge-green',
      rejected: 'badge-red',
      cancelled: 'badge-gray',
      available: 'badge-green',
      rented: 'badge-red',
      unavailable: 'badge-gray'
    };
    return map[status] || 'badge-gray';
  };

  const stats = {
    myBookings: myBookings.length,
    myListings: myProperties.length,
    pendingRequests,
    unreadNotifs,
  };

  return (
    <div className="dashboard-layout">
      <Sidebar items={sidebarItems} />
      <div className="dashboard-main">

        {/* Topbar */}
        <div className="dashboard-topbar">
          <div>
            <h1>
              {activeTab === 'dashboard' && 'My Dashboard'}
              {activeTab === 'my-bookings' && 'My Bookings'}
              {activeTab === 'my-listings' && 'My Property Listings'}
              {activeTab === 'add-property' && (editingProperty ? 'Edit Property' : 'List New Property')}
              {activeTab === 'requests' && 'Booking Requests'}
              {activeTab === 'notifications' && 'Notifications'}
              {activeTab === 'profile' && 'My Profile'}
            </h1>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              Welcome back, {user?.name}!
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleEnablePush} className="btn btn-primary btn-sm">
              🔔 Enable Notifications
            </button>
            <button
              onClick={() => { setActiveTab('add-property'); setEditingProperty(null); resetForm(); }}
              className="btn btn-success btn-sm"
            >
              + List Property
            </button>
          </div>
        </div>

        <div className="dashboard-content">

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

          {/* ── DASHBOARD TAB ───────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stats */}
              <div className="stats-row">
                <div className="stat-box">
                  <div className="stat-box-info">
                    <h3>My Bookings</h3>
                    <div className="num">{stats.myBookings}</div>
                  </div>
                  <div className="stat-box-icon" style={{ background: '#ede9fe' }}>📋</div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-info">
                    <h3>My Listings</h3>
                    <div className="num" style={{ color: '#057a55' }}>{stats.myListings}</div>
                  </div>
                  <div className="stat-box-icon" style={{ background: '#dcfce7' }}>🏠</div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-info">
                    <h3>Pending Requests</h3>
                    <div className="num" style={{ color: '#c27803' }}>{stats.pendingRequests}</div>
                  </div>
                  <div className="stat-box-icon" style={{ background: '#fdf6b2' }}>📩</div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-info">
                    <h3>Notifications</h3>
                    <div className="num" style={{ color: '#7c3aed' }}>{stats.unreadNotifs}</div>
                  </div>
                  <div className="stat-box-icon" style={{ background: '#ede9fe' }}>🔔</div>
                </div>
              </div>

              {/* 2 Column */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Recent Bookings */}
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
                        <button onClick={() => navigate('/properties')}
                          className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                          Browse Properties
                        </button>
                      </div>
                    ) : (
                      myBookings.slice(0, 4).map((b) => (
                        <div key={b._id} style={{
                          padding: '10px 0',
                          borderBottom: '1px solid #f1f5f9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '600' }}>{b.property?.title}</p>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>
                              {b.property?.city} · ${b.property?.rentPerWeek}/wk
                            </p>
                          </div>
                          <span className={`badge ${getStatusBadge(b.status)}`}>{b.status}</span>
                        </div>
                      ))
                    )}
                </div>

                {/* Incoming Requests */}
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h2 className="section-title" style={{ marginBottom: 0 }}>Incoming Requests</h2>
                    <span className="badge badge-yellow">{pendingRequests} pending</span>
                  </div>
                  {loading ? <div className="loading">Loading...</div> :
                    bookingRequests.filter(b => b.status === 'pending').length === 0 ? (
                      <div className="empty-state" style={{ padding: '20px' }}>
                        <p>No pending requests</p>
                      </div>
                    ) : (
                      bookingRequests.filter(b => b.status === 'pending').slice(0, 4).map((b) => (
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
                      ))
                    )}
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
                    <button onClick={() => navigate('/properties')}
                      className="btn btn-primary" style={{ marginTop: '12px' }}>
                      Browse Properties
                    </button>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Property</th>
                          <th>City</th>
                          <th>Rent/Week</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Owner Note</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myBookings.map((b) => (
                          <tr key={b._id}>
                            <td><strong>{b.property?.title}</strong></td>
                            <td style={{ color: '#6b7280' }}>{b.property?.city}</td>
                            <td><strong style={{ color: '#7c3aed' }}>${b.property?.rentPerWeek}/wk</strong></td>
                            <td>{new Date(b.preferredDate).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge ${getStatusBadge(b.status)}`}>{b.status}</span>
                            </td>
                            <td style={{ fontSize: '13px', color: '#6b7280' }}>
                              {b.ownerNote || '—'}
                            </td>
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
                <h2 className="section-title" style={{ marginBottom: 0 }}>My Property Listings</h2>
                <button
                  onClick={() => { setActiveTab('add-property'); setEditingProperty(null); resetForm(); }}
                  className="btn btn-primary btn-sm"
                >
                  + Add Property
                </button>
              </div>
              {loading ? <div className="loading">Loading...</div> :
                myProperties.length === 0 ? (
                  <div className="empty-state">
                    <h3>No listings yet</h3>
                    <button
                      onClick={() => { setActiveTab('add-property'); setEditingProperty(null); }}
                      className="btn btn-primary" style={{ marginTop: '12px' }}
                    >
                      List First Property
                    </button>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Property</th>
                          <th>Location</th>
                          <th>Rent/Week</th>
                          <th>Beds/Bath</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myProperties.map((p) => (
                          <tr key={p._id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '32px', height: '32px', background: '#ede9fe',
                                  borderRadius: '8px', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center'
                                }}>🏠</div>
                                <strong>{p.title}</strong>
                              </div>
                            </td>
                            <td style={{ color: '#6b7280' }}>📍 {p.city}</td>
                            <td><strong style={{ color: '#7c3aed' }}>${p.rentPerWeek}/wk</strong></td>
                            <td>{p.bedrooms} bed · {p.bathrooms} bath</td>
                            <td>
                              <span className={`badge ${getStatusBadge(p.status)}`}>{p.status}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => handleEditProperty(p)}
                                  className="btn btn-sm"
                                  style={{ background: '#ede9fe', color: '#5b21b6' }}>
                                  ✏ Edit
                                </button>
                                <button onClick={() => handleDeleteProperty(p._id)}
                                  className="btn btn-danger btn-sm">
                                  🗑 Delete
                                </button>
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

          {/* ── ADD/EDIT PROPERTY TAB ────────────────────────── */}
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
                      onChange={handleFormChange} placeholder="Property description..."
                      style={{ resize: 'vertical' }} />
                  </div>
                  <div className="form-group">
                    <label>Rent Per Week ($) *</label>
                    <input type="number" name="rentPerWeek" value={propertyForm.rentPerWeek}
                      onChange={handleFormChange} placeholder="e.g. 500" />
                  </div>
                  <div className="form-group">
                    <label>Property Type</label>
                    <select name="propertyType" value={propertyForm.propertyType}
                      onChange={handleFormChange}>
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="studio">Studio</option>
                      <option value="townhouse">Townhouse</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Bedrooms *</label>
                    <input type="number" name="bedrooms" value={propertyForm.bedrooms}
                      onChange={handleFormChange} placeholder="e.g. 3" />
                  </div>
                  <div className="form-group">
                    <label>Bathrooms *</label>
                    <input type="number" name="bathrooms" value={propertyForm.bathrooms}
                      onChange={handleFormChange} placeholder="e.g. 2" />
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
                    {editingProperty ? 'Update Property' : 'List Property'}
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

          {/* ── BOOKING REQUESTS TAB ────────────────────────── */}
          {activeTab === 'requests' && (
            <div className="card">
              <h2 className="section-title">Requests for My Properties</h2>
              {loading ? <div className="loading">Loading...</div> :
                bookingRequests.length === 0 ? (
                  <div className="empty-state"><h3>No requests yet</h3></div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>From</th>
                          <th>Property</th>
                          <th>Date</th>
                          <th>Message</th>
                          <th>Status</th>
                          <th>Actions</th>
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
                            <td><strong>{b.property?.title}</strong></td>
                            <td>{new Date(b.preferredDate).toLocaleDateString()}</td>
                            <td style={{ fontSize: '13px', color: '#6b7280', maxWidth: '150px' }}>
                              {b.message || '—'}
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadge(b.status)}`}>{b.status}</span>
                            </td>
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

          {/* ── NOTIFICATIONS TAB ───────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="section-title">Notifications</h2>
              {notifications.length === 0 ? (
                <div className="empty-state"><h3>No notifications yet</h3></div>
              ) : (
                notifications.map((n) => (
                  <div key={n._id} style={{
                    padding: '14px', borderRadius: '8px', marginBottom: '8px',
                    background: n.isRead ? '#f9fafb' : '#faf5ff',
                    border: `1px solid ${n.isRead ? '#e5e7eb' : '#ddd6fe'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '14px' }}>{n.title}</p>
                        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>{n.body}</p>
                      </div>
                      <span style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── PROFILE TAB ─────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="card" style={{ maxWidth: '500px' }}>
              <h2 className="section-title">My Profile</h2>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: '#7c3aed', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '28px', fontWeight: '700',
                  color: 'white', margin: '0 auto 12px'
                }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{user?.name}</h3>
                <span className="badge badge-blue" style={{ marginTop: '6px' }}>
                  {user?.role}
                </span>
              </div>
              {[
                { label: 'Full Name', value: user?.name },
                { label: 'Email Address', value: user?.email },
                { label: 'Phone', value: user?.phone || 'Not provided' },
                { label: 'Account Type', value: user?.role },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  padding: '12px 16px', background: '#f9fafb',
                  borderRadius: '8px', marginBottom: '8px'
                }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>{label}</p>
                  <p style={{ fontSize: '14px', fontWeight: '500', textTransform: 'capitalize' }}>{value}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default UserDashboard;