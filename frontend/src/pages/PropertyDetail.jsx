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
    if (dateErr) { setDateError(dateErr); return; }

    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess('');

    try {
      await api.post('/bookings', {
        propertyId: id,
        preferredDate: bookingData.preferredDate,
        message: bookingData.message,
      });
      setBookingSuccess('Booking request sent successfully! Owner will review it.');
      setBookingData({ preferredDate: '', message: '' });
    } catch (error) {
      setBookingError(error.response?.data?.message || 'Booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!property) return <div className="container"><p>Property not found.</p></div>;

  return (
    <div className="container">
      <button onClick={() => navigate('/properties')} className="btn"
        style={{ background: '#f3f4f6', color: '#374151', marginBottom: '20px' }}>
        ← Back to Listings
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Property Info */}
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{
              background: '#e1effe', borderRadius: '8px', height: '280px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', marginBottom: '20px'
            }}>🏠</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700' }}>{property.title}</h1>
              <span className={`badge ${property.status === 'available' ? 'badge-green' : 'badge-red'}`}>
                {property.status}
              </span>
            </div>

            <p style={{ color: '#6b7280', marginBottom: '16px' }}>📍 {property.address}, {property.city}</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#1a56db', marginBottom: '16px' }}>
              ${property.rentPerWeek}/week
            </p>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center', padding: '12px 20px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px' }}>🛏</div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>{property.bedrooms}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Bedrooms</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 20px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px' }}>🚿</div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>{property.bathrooms}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Bathrooms</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 20px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px' }}>🏗</div>
                <div style={{ fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>{property.propertyType}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Type</div>
              </div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Description</h3>
            <p style={{ color: '#4b5563', lineHeight: '1.6', marginBottom: '16px' }}>{property.description}</p>

            {property.amenities?.length > 0 && (
              <>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Amenities</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {property.amenities.map((a, i) => (
                    <span key={i} className="badge badge-blue">✓ {a}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Owner Info */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Property Owner</h3>
            <p><strong>{property.owner?.name}</strong></p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>📧 {property.owner?.email}</p>
            {property.owner?.phone && <p style={{ color: '#6b7280', fontSize: '14px' }}>📞 {property.owner?.phone}</p>}
          </div>
        </div>

        {/* Booking Form */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '80px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>📅 Book a Viewing</h3>

            {!user ? (
              <div>
                <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px' }}>
                  Please login to book a viewing
                </p>
                <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%' }}>
                  Login to Book
                </button>
              </div>
            ) : user.role !== 'tenant' ? (
              <div className="alert alert-error">Only tenants can book properties.</div>
            ) : property.status !== 'available' ? (
              <div className="alert alert-error">This property is not available for booking.</div>
            ) : (
              <form onSubmit={handleBooking}>
                {bookingError && <div className="alert alert-error">{bookingError}</div>}
                {bookingSuccess && <div className="alert alert-success">{bookingSuccess}</div>}

                <div className="form-group">
                  <label>Preferred Viewing Date</label>
                  <input type="date" value={bookingData.preferredDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => { setBookingData({ ...bookingData, preferredDate: e.target.value }); setDateError(''); }} />
                  {dateError && <p className="error-text">{dateError}</p>}
                </div>

                <div className="form-group">
                  <label>Message (Optional)</label>
                  <textarea rows="4" placeholder="Any specific requirements or questions..."
                    value={bookingData.message}
                    onChange={(e) => setBookingData({ ...bookingData, message: e.target.value })}
                    style={{ resize: 'vertical' }} />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={bookingLoading}>
                  {bookingLoading ? 'Sending...' : 'Send Booking Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;