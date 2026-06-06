import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PropertyCard = ({ property, onViewDetails, savedIds = [] }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { _id, title, address, city, rentPerWeek, bedrooms, bathrooms, propertyType, status } = property;

  const [isSaved, setIsSaved] = useState(savedIds.includes(_id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsSaved(savedIds.includes(_id));
  }, [savedIds, _id]);

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    setSaving(true);
    try {
      const res = await api.post(`/auth/wishlist/${_id}`);
      setIsSaved(res.data.isSaved);
    } catch (error) {
      console.error('Wishlist error:', error);
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = { available: 'badge-green', rented: 'badge-red', unavailable: 'badge-gray' };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    if (onViewDetails) onViewDetails(property);
    else navigate(`/properties/${_id}`);
  };

  return (
    <div className="card"
      style={{ display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', position: 'relative' }}
      onClick={() => { if (onViewDetails) onViewDetails(property); else navigate(`/properties/${_id}`); }}>

      {/* Wishlist Heart Button */}
      <button
        onClick={handleWishlist}
        disabled={saving}
        style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'white', border: 'none', borderRadius: '50%',
          width: '32px', height: '32px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 1,
          fontSize: '16px', transition: 'transform 0.15s'
        }}
        title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
      >
        {isSaved ? '❤️' : '🤍'}
      </button>

      {/* Image */}
      <div style={{
        background: 'linear-gradient(135deg, #ede9fe, #dbeafe)',
        borderRadius: '8px', height: '160px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px'
      }}>🏠</div>

      {/* Title + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', flex: 1, lineHeight: '1.4' }}>
          {title}
        </h3>
        <span className={`badge ${statusBadge[status] || 'badge-gray'}`} style={{ flexShrink: 0 }}>
          {status}
        </span>
      </div>

      <p style={{ fontSize: '13px', color: '#6b7280' }}>📍 {address}, {city}</p>

      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6b7280' }}>
        <span>🛏 {bedrooms} bed</span>
        <span>🚿 {bathrooms} bath</span>
        <span style={{ textTransform: 'capitalize' }}>🏗 {propertyType}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <strong style={{ fontSize: '18px', color: '#7c3aed' }}>${rentPerWeek}/week</strong>
        <button onClick={handleViewDetails} className="btn btn-primary btn-sm">
          View Details
        </button>
      </div>
    </div>
  );
};

export default PropertyCard;