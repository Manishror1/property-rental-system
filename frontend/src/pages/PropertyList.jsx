import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PropertyCard from '../components/PropertyCard';
import { useAuth } from '../contexts/AuthContext';

const PropertyList = ({ embedded = false, onViewProperty, savedIds = [] }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '', minRent: '', maxRent: '', bedrooms: '', propertyType: ''
  });

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.city) params.city = filters.city;
      if (filters.minRent) params.minRent = filters.minRent;
      if (filters.maxRent) params.maxRent = filters.maxRent;
      if (filters.bedrooms) params.bedrooms = filters.bedrooms;
      if (filters.propertyType) params.propertyType = filters.propertyType;
      const res = await api.get('/properties', { params });
      setProperties(res.data.properties);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleReset = () => {
    setFilters({ city: '', minRent: '', maxRent: '', bedrooms: '', propertyType: '' });
    setTimeout(fetchProperties, 100);
  };

  // Public page wrapper — same look as dashboard
  const Wrapper = ({ children }) => {
    if (embedded) {
      return <div>{children}</div>;
    }
    return (
      <div style={{ background: '#f3f4f6', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 32px' }}>
          {children}
        </div>
      </div>
    );
  };
  const content = (
    <>
      {/* Filter Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <form onSubmit={handleSearch}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '12px',
            alignItems: 'end'
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>City</label>
              <input type="text" placeholder="e.g. Auckland"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Min Rent ($/week)</label>
              <input type="number" placeholder="e.g. 300"
                value={filters.minRent}
                onChange={(e) => setFilters({ ...filters, minRent: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Max Rent ($/week)</label>
              <input type="number" placeholder="e.g. 800"
                value={filters.maxRent}
                onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Bedrooms</label>
              <select value={filters.bedrooms}
                onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}>
                <option value="">Any</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4+</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Type</label>
              <select value={filters.propertyType}
                onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}>
                <option value="">All Types</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="studio">Studio</option>
                <option value="townhouse">Townhouse</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Search
              </button>
              <button type="button" className="btn" onClick={handleReset}
                style={{ background: '#f3f4f6', color: '#374151' }}>
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="loading">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏠</div>
          <h3>No properties found</h3>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <p style={{ marginBottom: '16px', color: '#6b7280', fontSize: '14px' }}>
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
          </p>
          <div className="grid-3">
            {properties.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                onViewDetails={onViewProperty || null}
                savedIds={savedIds}
              />
            ))}
          </div>
        </>
      )}
    </>
  );

  return <Wrapper>{content}</Wrapper>;
};

export default PropertyList;