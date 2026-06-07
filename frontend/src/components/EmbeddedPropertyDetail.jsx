import { useState, useEffect } from 'react';
import api from '../services/api';
import { validateDate } from '../utils/validators';
import { useAuth } from '../contexts/AuthContext';

const EmbeddedPropertyDetail = ({ propertyId, onBack }) => {
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking states
  const [bookingData, setBookingData] = useState({ preferredDate: '', message: '' });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [dateError, setDateError] = useState('');

  // Existing booking check
  const [existingBooking, setExistingBooking] = useState(null);
  const [checkingBooking, setCheckingBooking] = useState(false);

  // Message states
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [msgError, setMsgError] = useState('');
  const [msgSuccess, setMsgSuccess] = useState('');
  const [msgSending, setMsgSending] = useState(false);

  // Fetch property
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/properties/${propertyId}`);
        setProperty(res.data.property);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId]);

  // Check existing booking
  useEffect(() => {
    const checkExistingBooking = async () => {
      if (!user || user.role === 'admin' || !propertyId) return;
      try {
        setCheckingBooking(true);
        const res = await api.get(`/properties/${propertyId}/my-booking`);
        setExistingBooking(res.data.booking);
      } catch (error) {
        console.error('Booking check error:', error);
      } finally {
        setCheckingBooking(false);
      }
    };
    checkExistingBooking();
  }, [propertyId, user]);

  // Handle booking submission
  const handleBooking = async (e) => {
    e.preventDefault();
    const dateErr = validateDate(bookingData.preferredDate);
    if (dateErr) { setDateError(dateErr); return; }
    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess('');
    try {
      await api.post('/bookings', {
        propertyId,
        preferredDate: bookingData.preferredDate,
        message: bookingData.message,
      });
      setBookingSuccess('Booking request sent! Owner will review it.');
      setBookingData({ preferredDate: '', message: '' });
      // Refresh booking check
      const res = await api.get(`/properties/${propertyId}/my-booking`);
      setExistingBooking(res.data.booking);
    } catch (error) {
      setBookingError(error.response?.data?.message || 'Booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!msgText.trim()) return;
    setMsgSending(true);
    setMsgError('');
    setMsgSuccess('');
    try {
      await api.post('/messages', {
        receiverId: property.owner._id,
        message: msgText.trim(),
        propertyId: property._id,
      });
      setMsgSuccess('✅ Message sent! Check your Messages tab.');
      setMsgText('');
      setShowMessageForm(false);
    } catch (error) {
      setMsgError(error.response?.data?.message || 'Failed to send message.');
    } finally {
      setMsgSending(false);
    }
  };

  const isOwnProperty = user && property && (
    property.owner?._id?.toString() === user.id?.toString() ||
    property.owner?._id?.toString() === user._id?.toString()
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏠</div>
        <p style={{ color: '#6b7280' }}>Loading property...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="empty-state">
        <h3>Property not found</h3>
        <button onClick={onBack} className="btn btn-primary" style={{ marginTop: '12px' }}>
          ← Back to Properties
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="btn"
        style={{ background: '#f3f4f6', color: '#374151', marginBottom: '20px' }}>
        ← Back to Properties
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', alignItems: 'start' }}>

        {/* LEFT */}
        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ede9fe, #dbeafe)',
              borderRadius: '10px', height: '260px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '80px', marginBottom: '20px'
            }}>🏠</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '700', flex: 1, marginRight: '12px' }}>
                {property.title}
              </h1>
              <span className={`badge ${
                property.status === 'available' ? 'badge-green' :
                property.status === 'rented' ? 'badge-red' : 'badge-gray'
              }`}>{property.status}</span>
            </div>

            <p style={{ color: '#6b7280', marginBottom: '12px', fontSize: '14px' }}>
              📍 {property.address}, {property.city}
            </p>

            <p style={{ fontSize: '26px', fontWeight: '700', color: '#7c3aed', marginBottom: '20px' }}>
              ${property.rentPerWeek}/week
            </p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              {[
                { icon: '🛏', value: property.bedrooms, label: 'Bedrooms' },
                { icon: '🚿', value: property.bathrooms, label: 'Bathrooms' },
                { icon: '🏗', value: property.propertyType, label: 'Type' },
              ].map(({ icon, value, label }) => (
                <div key={label} style={{
                  textAlign: 'center', padding: '12px 16px',
                  background: '#f9fafb', borderRadius: '10px',
                  flex: 1, border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '20px' }}>{icon}</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginTop: '4px', textTransform: 'capitalize' }}>
                    {value}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{label}</div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Description</h3>
            <p style={{ color: '#4b5563', lineHeight: '1.7', marginBottom: '16px', fontSize: '14px' }}>
              {property.description}
            </p>

            {property.amenities?.length > 0 && (
              <>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Amenities</h3>
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
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>Property Owner</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: '#7c3aed', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: 'white'
              }}>
                {property.owner?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: '600', fontSize: '14px' }}>{property.owner?.name}</p>
                <p style={{ color: '#6b7280', fontSize: '13px' }}>📧 {property.owner?.email}</p>
                {property.owner?.phone && (
                  <p style={{ color: '#6b7280', fontSize: '13px' }}>📞 {property.owner?.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '80px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '16px' }}>
              📅 Book a Viewing
            </h3>

            {/* Not logged in */}
            {!user ? (
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Please login to book a viewing.
              </p>

            /* Admin */
            ) : user.role === 'admin' ? (
              <div className="alert alert-error">Admins cannot book properties.</div>

            /* Own property */
            ) : isOwnProperty ? (
              <div className="alert alert-error">
                This is your own property. You cannot book it.
              </div>

            /* Not available */
            ) : property.status !== 'available' ? (
              <div className="alert alert-error">
                This property is currently {property.status} and not available.
              </div>

            /* Checking */
            ) : checkingBooking ? (
              <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>
                Checking your bookings...
              </p>

            /* Already booked */
            ) : existingBooking ? (
              <div>
                <div className={`alert ${existingBooking.status === 'approved' ? 'alert-success' : 'alert-error'}`}
                  style={{ marginBottom: '12px' }}>
                  {existingBooking.status === 'pending'
                    ? '⏳ You already have a pending booking for this property!'
                    : '✅ Your viewing has been approved!'}
                </div>
                <div style={{
                  background: '#f9fafb', borderRadius: '8px',
                  padding: '12px', border: '1px solid #e5e7eb', marginBottom: '12px'
                }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                    Booking Details:
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '13px', fontWeight: '500' }}>
                      📅 {new Date(existingBooking.preferredDate).toLocaleDateString('en-NZ', {
                        weekday: 'short', month: 'short', day: 'numeric'
                      })}
                    </p>
                    <span className={`badge ${
                      existingBooking.status === 'approved' ? 'badge-green' : 'badge-yellow'
                    }`}>
                      {existingBooking.status}
                    </span>
                  </div>
                  {existingBooking.ownerNote && (
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                      💬 {existingBooking.ownerNote}
                    </p>
                  )}
                </div>
              </div>

            /* Booking Form */
            ) : (
              <form onSubmit={handleBooking}>
                {bookingError && (
                  <div className="alert alert-error" style={{ marginBottom: '12px' }}>
                    {bookingError}
                  </div>
                )}
                {bookingSuccess && (
                  <div className="alert alert-success" style={{ marginBottom: '12px' }}>
                    {bookingSuccess}
                  </div>
                )}

                <div className="form-group">
                  <label>Preferred Viewing Date</label>
                  <input type="date"
                    value={bookingData.preferredDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setBookingData({ ...bookingData, preferredDate: e.target.value });
                      setDateError('');
                    }} />
                  {dateError && <p className="error-text">{dateError}</p>}
                </div>

                <div className="form-group">
                  <label>Message (Optional)</label>
                  <textarea rows="3"
                    placeholder="Any questions or requirements..."
                    value={bookingData.message}
                    onChange={(e) => setBookingData({ ...bookingData, message: e.target.value })}
                    style={{ resize: 'vertical' }} />
                </div>

                <div style={{
                  background: '#f9fafb', borderRadius: '8px',
                  padding: '10px 12px', marginBottom: '14px', border: '1px solid #e5e7eb'
                }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}>Booking for:</p>
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>{property.title}</p>
                  <p style={{ fontSize: '13px', color: '#7c3aed', fontWeight: '600' }}>
                    ${property.rentPerWeek}/week
                  </p>
                </div>

                <button type="submit" className="btn btn-primary"
                  style={{ width: '100%', padding: '11px' }}
                  disabled={bookingLoading}>
                  {bookingLoading ? 'Sending...' : 'Send Booking Request'}
                </button>

                <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '8px' }}>
                  Owner will respond shortly
                </p>
              </form>
            )}

            {/* Contact Owner */}
            {user && user.role !== 'admin' && !isOwnProperty && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                  💬 Contact Owner
                </p>

                {msgSuccess && (
                  <div className="alert alert-success" style={{ marginBottom: '10px', fontSize: '12px' }}>
                    {msgSuccess}
                  </div>
                )}

                {!showMessageForm ? (
                  <button onClick={() => setShowMessageForm(true)} className="btn"
                    style={{
                      width: '100%', background: '#f0fdf4',
                      border: '1px solid #bbf7d0', color: '#15803d',
                      padding: '10px', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                    }}>
                    💬 Send Message to Owner
                  </button>
                ) : (
                  <div>
                    {msgError && (
                      <div className="alert alert-error" style={{ marginBottom: '8px', fontSize: '12px' }}>
                        {msgError}
                      </div>
                    )}
                    <textarea rows="3"
                      placeholder={`Hi, I'm interested in "${property.title}"...`}
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '8px',
                        border: '1px solid #e5e7eb', fontSize: '13px',
                        resize: 'vertical', outline: 'none',
                        marginBottom: '8px', fontFamily: 'inherit'
                      }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleSendMessage}
                        disabled={msgSending || !msgText.trim()}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '9px', fontSize: '13px' }}>
                        {msgSending ? 'Sending...' : '➤ Send'}
                      </button>
                      <button
                        onClick={() => { setShowMessageForm(false); setMsgText(''); setMsgError(''); }}
                        className="btn"
                        style={{ padding: '9px 14px', background: '#f3f4f6', color: '#374151', fontSize: '13px' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedPropertyDetail;