import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { validateDate } from '../utils/validators';

const PropertyDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({ preferredDate: '', message: '' });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/properties/${id}`);
        setProperty(res.data.property);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const handleBooking = async (e) => {
    e.preventDefault();
    const dateErr = validateDate(bookingData.preferredDate);
    if (dateErr) {
      setDateError(dateErr);
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess('');

    try {
      await api.post('/bookings', {
        propertyId: id,
        preferredDate: bookingData.preferredDate,
        message: bookingData.message,
      });
      setBookingSuccess('Booking request sent! Owner will review it.');
      setBookingData({ preferredDate: '', message: '' });
    } catch (error) {
      setBookingError(error.response?.data?.message || 'Booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Check if this is user's own property
  const isOwnProperty = user && property && property.owner?._id === user.id;

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center',
        alignItems: 'center', height: '60vh'
      }}>
        <p style={{ color: '#6b7280' }}>Loading property...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container">
        <p>Property not found.</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Back Button */}
      <button
        onClick={() => navigate('/properties')}
        className="btn"
        style={{
          background: '#f3f4f6',
          color: '#374151',
          marginBottom: '20px'
        }}
      >
        ← Back to Listings
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '24px',
        alignItems: 'start'
      }}>

        {/* ── LEFT SIDE — Property Info ─────────────────── */}
        <div>
          {/* Property Image */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ede9fe, #dbeafe)',
              borderRadius: '10px',
              height: '280px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '80px',
              marginBottom: '20px'
            }}>
              🏠
            </div>

            {/* Title + Status */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '10px'
            }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700', flex: 1 }}>
                {property.title}
              </h1>
              <span className={`badge ${property.status === 'available'
                ? 'badge-green'
                : property.status === 'rented'
                  ? 'badge-red'
                  : 'badge-gray'
                }`}>
                {property.status}
              </span>
            </div>

            {/* Location */}
            <p style={{ color: '#6b7280', marginBottom: '14px', fontSize: '15px' }}>
              📍 {property.address}, {property.city}
            </p>

            {/* Price */}
            <p style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#7c3aed',
              marginBottom: '20px'
            }}>
              ${property.rentPerWeek}/week
            </p>

            {/* Property Stats */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              {[
                { icon: '🛏', value: property.bedrooms, label: 'Bedrooms' },
                { icon: '🚿', value: property.bathrooms, label: 'Bathrooms' },
                { icon: '🏗', value: property.propertyType, label: 'Type' },
              ].map(({ icon, value, label }) => (
                <div key={label} style={{
                  textAlign: 'center',
                  padding: '14px 20px',
                  background: '#f9fafb',
                  borderRadius: '10px',
                  flex: 1,
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '22px' }}>{icon}</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    marginTop: '4px',
                    textTransform: 'capitalize'
                  }}>
                    {value}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#111827'
            }}>
              Description
            </h3>
            <p style={{
              color: '#4b5563',
              lineHeight: '1.7',
              marginBottom: '20px',
              fontSize: '15px'
            }}>
              {property.description}
            </p>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  color: '#111827'
                }}>
                  Amenities
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {property.amenities.map((a, i) => (
                    <span key={i} className="badge badge-blue">
                      ✓ {a}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Owner Info */}
          <div className="card">
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '14px',
              color: '#111827'
            }}>
              Property Owner
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: '#7c3aed', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: '700', color: 'white'
              }}>
                {property.owner?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: '600', fontSize: '15px' }}>
                  {property.owner?.name}
                </p>
                <p style={{ color: '#6b7280', fontSize: '13px' }}>
                  📧 {property.owner?.email}
                </p>
                {property.owner?.phone && (
                  <p style={{ color: '#6b7280', fontSize: '13px' }}>
                    📞 {property.owner?.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDE — Booking Form ─────────────────── */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '80px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#111827'
            }}>
              📅 Book a Viewing
            </h3>

            {/* Not logged in */}
            {!user ? (
              <div>
                <p style={{
                  color: '#6b7280',
                  marginBottom: '16px',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  Please login to book a viewing for this property.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  Login to Book
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginTop: '8px',
                    background: '#f3f4f6',
                    color: '#374151'
                  }}
                >
                  Create Account
                </button>
              </div>

            /* Admin cannot book */
            ) : user.role === 'admin' ? (
              <div className="alert alert-error">
                Admins cannot book properties.
              </div>

            /* Own property — cannot book */
            ) : isOwnProperty ? (
              <div>
                <div className="alert alert-error" style={{ marginBottom: '12px' }}>
                  This is your own property. You cannot book it.
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Go to Dashboard
                </button>
              </div>

            /* Property not available */
            ) : property.status !== 'available' ? (
              <div className="alert alert-error">
                This property is not available for booking right now.
              </div>

            /* Booking Form */
            ) : (
              <form onSubmit={handleBooking}>
                {bookingError && (
                  <div className="alert alert-error">{bookingError}</div>
                )}
                {bookingSuccess && (
                  <div className="alert alert-success">{bookingSuccess}</div>
                )}

                <div className="form-group">
                  <label>Preferred Viewing Date</label>
                  <input
                    type="date"
                    value={bookingData.preferredDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setBookingData({ ...bookingData, preferredDate: e.target.value });
                      setDateError('');
                    }}
                  />
                  {dateError && <p className="error-text">{dateError}</p>}
                </div>

                <div className="form-group">
                  <label>Message (Optional)</label>
                  <textarea
                    rows="4"
                    placeholder="Any specific requirements or questions..."
                    value={bookingData.message}
                    onChange={(e) => setBookingData({
                      ...bookingData,
                      message: e.target.value
                    })}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Property Summary */}
                <div style={{
                  background: '#f9fafb',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    Booking for:
                  </p>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{property.title}</p>
                  <p style={{ fontSize: '13px', color: '#7c3aed', fontWeight: '600' }}>
                    ${property.rentPerWeek}/week
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? 'Sending...' : 'Send Booking Request'}
                </button>

                <p style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  textAlign: 'center',
                  marginTop: '10px'
                }}>
                  Owner will be notified and will respond shortly
                </p>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PropertyDetail;