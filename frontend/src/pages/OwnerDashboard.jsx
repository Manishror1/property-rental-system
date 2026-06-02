import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { validateRequired } from '../utils/validators';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [editingProperty, setEditingProperty] = useState(null);

  const [propertyForm, setPropertyForm] = useState({
    title: '', description: '', address: '', city: '',
    rentPerWeek: '', bedrooms: '', bathrooms: '',
    propertyType: 'house', amenities: '', status: 'available'
  });

  const fetchData = async () => {
    try {
      const [bookingsRes, propertiesRes] = await Promise.all([
        api.get('/bookings/requests'),
        api.get('/properties/my-listings'),
      ]);
      setBookings(bookingsRes.data.bookings);
      setProperties(propertiesRes.data.properties);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleBookingAction = async (bookingId, status, note = '') => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status, ownerNote: note });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed.');
    }
  };

  const handleFormChange = (e) => {
    setPropertyForm({ ...propertyForm, [e.target.name]: e.target.value });
    setFormError('');
  };

  const validateForm = () => {
    const fields = ['title', 'description', 'address', 'city', 'rentPerWeek', 'bedrooms', 'bathrooms'];
    for (const field of fields) {
      const err = validateRequired(propertyForm[field], field);
      if (err) return err;
    }
    return null;
  };

  const handleSubmitProperty = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { setFormError(err); return; }

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
        setFormSuccess('Property updated successfully!');
      } else {
        await api.post('/properties', data);
        setFormSuccess('Property added successfully!');
      }

      setShowAddForm(false);
      setEditingProperty(null);
      setPropertyForm({
        title: '', description: '', address: '', city: '',
        rentPerWeek: '', bedrooms: '', bathrooms: '',
        propertyType: 'house', amenities: '', status: 'available'
      });
      fetchData();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Failed to save property.');
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
    setShowAddForm(true);
    setActiveTab('properties');
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Delete this property?')) return;
    try {
      await api.delete(`/properties/${propertyId}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed.');
    }
  };

  const getStatusBadge = (status) => {
    const map = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red', cancelled: 'badge-gray' };
    return map[status] || 'badge-gray';
  };

  const stats = {
    properties: properties.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    total: bookings.length,
  };

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '4px' }}>🏠 Owner Dashboard</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Welcome, {user?.name}!</p>
        </div>
        <button
          onClick={() => { setShowAddForm(!showAddForm); setActiveTab('properties'); setEditingProperty(null); setFormError(''); setFormSuccess(''); }}
          className="btn btn-primary"
        >
          {showAddForm ? '✕ Cancel' : '+ Add Property'}
        </button>
      </div>

      {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.properties}</div>
          <div className="stat-label">My Properties</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#c27803' }}>{stats.pending}</div>
          <div className="stat-label">Pending Requests</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#057a55' }}>{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Requests</div>
        </div>
      </div>

      {/* Add/Edit Property Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 className="section-title">{editingProperty ? 'Edit Property' : 'Add New Property'}</h2>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleSubmitProperty}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" name="title" placeholder="Property title" value={propertyForm.title} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>City *</label>
                <input type="text" name="city" placeholder="e.g. Auckland" value={propertyForm.city} onChange={handleFormChange} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Address *</label>
                <input type="text" name="address" placeholder="Full address" value={propertyForm.address} onChange={handleFormChange} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description *</label>
                <textarea name="description" rows="3" placeholder="Property description" value={propertyForm.description} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Rent Per Week ($) *</label>
                <input type="number" name="rentPerWeek" placeholder="e.g. 500" value={propertyForm.rentPerWeek} onChange={handleFormChange} />
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
                <input type="number" name="bedrooms" placeholder="e.g. 3" value={propertyForm.bedrooms} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Bathrooms *</label>
                <input type="number" name="bathrooms" placeholder="e.g. 2" value={propertyForm.bathrooms} onChange={handleFormChange} />
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
                <input type="text" name="amenities" placeholder="WiFi, Parking, Dishwasher" value={propertyForm.amenities} onChange={handleFormChange} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary">
                {editingProperty ? 'Update Property' : 'Add Property'}
              </button>
              <button type="button" className="btn" onClick={() => { setShowAddForm(false); setEditingProperty(null); }}
                style={{ background: '#f3f4f6', color: '#374151' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        {['bookings', 'properties'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 24px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
              background: 'none', borderBottom: activeTab === tab ? '2px solid #1a56db' : '2px solid transparent',
              color: activeTab === tab ? '#1a56db' : '#6b7280', marginBottom: '-2px',
            }}>
            {tab === 'bookings' ? `📋 Booking Requests (${stats.pending} pending)` : `🏠 My Properties (${stats.properties})`}
          </button>
        ))}
      </div>

      {loading ? <div className="loading">Loading...</div> : (
        <>
          {/* Booking Requests Tab */}
          {activeTab === 'bookings' && (
            <div className="card">
              {bookings.length === 0 ? (
                <div className="empty-state"><h3>No booking requests yet</h3></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Tenant</th>
                        <th>Contact</th>
                        <th>Preferred Date</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking._id}>
                          <td><strong>{booking.property?.title}</strong></td>
                          <td>{booking.tenant?.name}</td>
                          <td style={{ fontSize: '13px', color: '#6b7280' }}>{booking.tenant?.email}</td>
                          <td>{new Date(booking.preferredDate).toLocaleDateString()}</td>
                          <td style={{ fontSize: '13px', color: '#6b7280', maxWidth: '150px' }}>
                            {booking.message || '—'}
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(booking.status)}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td>
                            {booking.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => handleBookingAction(booking._id, 'approved', 'Approved! Please come on time.')}
                                  className="btn btn-success btn-sm">✓ Approve</button>
                                <button onClick={() => handleBookingAction(booking._id, 'rejected', 'Sorry, not available.')}
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

          {/* My Properties Tab */}
          {activeTab === 'properties' && (
            <div className="card">
              {properties.length === 0 ? (
                <div className="empty-state">
                  <h3>No properties listed yet</h3>
                  <p>Click "Add Property" to list your first property!</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Location</th>
                        <th>Rent/Week</th>
                        <th>Bedrooms</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.map((property) => (
                        <tr key={property._id}>
                          <td><strong>{property.title}</strong></td>
                          <td style={{ color: '#6b7280' }}>{property.address}, {property.city}</td>
                          <td><strong style={{ color: '#1a56db' }}>${property.rentPerWeek}</strong></td>
                          <td>{property.bedrooms}</td>
                          <td style={{ textTransform: 'capitalize' }}>{property.propertyType}</td>
                          <td>
                            <span className={`badge ${property.status === 'available' ? 'badge-green' : property.status === 'rented' ? 'badge-red' : 'badge-gray'}`}>
                              {property.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleEditProperty(property)} className="btn btn-sm"
                                style={{ background: '#e1effe', color: '#1e429f' }}>Edit</button>
                              <button onClick={() => handleDeleteProperty(property._id)} className="btn btn-danger btn-sm">Delete</button>
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
        </>
      )}
    </div>
  );
};

export default OwnerDashboard;