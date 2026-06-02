import { Link } from 'react-router-dom';

const PropertyCard = ({ property }) => {
  const { _id, title, address, city, rentPerWeek, bedrooms, bathrooms, propertyType, status } = property;

  const statusBadge = {
    available: 'badge-green',
    rented: 'badge-red',
    unavailable: 'badge-gray',
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        background: '#e1effe',
        borderRadius: '8px',
        height: '140px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px'
      }}>
        🏠
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', flex: 1 }}>{title}</h3>
        <span className={`badge ${statusBadge[status]}`}>{status}</span>
      </div>

      <p style={{ fontSize: '14px', color: '#6b7280' }}>📍 {address}, {city}</p>

      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
        <span>🛏 {bedrooms} bed</span>
        <span>🚿 {bathrooms} bath</span>
        <span>🏗 {propertyType}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <strong style={{ fontSize: '18px', color: '#1a56db' }}>${rentPerWeek}/week</strong>
        <Link to={`/properties/${_id}`} className="btn btn-primary btn-sm">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default PropertyCard;