import { useState } from 'react';
import api from '../services/api';

const ProfileTab = ({ user, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [pwMode, setPwMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || profileForm.name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/update-profile', profileForm);
      setMessage('Profile updated successfully!');
      setError('');
      setEditMode(false);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setMessage('Password changed successfully!');
      setError('');
      setPwMode(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px' }}>
      <div className="card">

        {/* Avatar */}
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
          <span className="badge badge-blue" style={{ marginTop: '6px' }}>{user?.role}</span>
        </div>

        {message && <div className="alert alert-success" style={{ marginBottom: '12px' }}>{message}</div>}
        {error && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{error}</div>}

        {/* View Mode */}
        {!editMode && !pwMode && (
          <>
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => { setEditMode(true); setError(''); setMessage(''); }}
                className="btn btn-primary" style={{ flex: 1 }}>
                ✏️ Edit Profile
              </button>
              <button
                onClick={() => { setPwMode(true); setError(''); setMessage(''); }}
                className="btn"
                style={{ flex: 1, background: '#f3f4f6', color: '#374151' }}>
                🔒 Change Password
              </button>
            </div>
          </>
        )}

        {/* Edit Profile Mode */}
        {editMode && (
          <form onSubmit={handleProfileSave}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px' }}>Edit Profile</h3>
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="Your phone number" />
            </div>
            <div className="form-group">
              <label>Email (Cannot be changed)</label>
              <input type="email" value={user?.email} disabled
                style={{ background: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary"
                style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button"
                onClick={() => { setEditMode(false); setError(''); }}
                className="btn"
                style={{ flex: 1, background: '#f3f4f6', color: '#374151' }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Change Password Mode */}
        {pwMode && (
          <form onSubmit={handlePasswordChange}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px' }}>Change Password</h3>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                placeholder="Enter current password" />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                placeholder="Minimum 6 characters" />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                placeholder="Repeat new password" />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary"
                style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
              <button type="button"
                onClick={() => { setPwMode(false); setError(''); }}
                className="btn"
                style={{ flex: 1, background: '#f3f4f6', color: '#374151' }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileTab;