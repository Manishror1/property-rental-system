import { useState } from 'react';
import api from '../services/api';

const SettingsTab = ({ user }) => {
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(
    Notification.permission === 'granted'
  );

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }

    setPwLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Account Info */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px', color: '#111827' }}>
          ⚙️ Account Settings
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: '#f9fafb', borderRadius: '10px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: '#7c3aed', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: 'white'
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: '600', fontSize: '15px', color: '#111827' }}>{user?.name}</p>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>{user?.email}</p>
            <span className="badge badge-blue" style={{ marginTop: '4px', fontSize: '11px', textTransform: 'capitalize' }}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications Settings */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px', color: '#111827' }}>
          🔔 Notification Settings
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>Push Notifications</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Receive alerts for booking updates</p>
          </div>
          <div style={{
            width: '44px', height: '24px', borderRadius: '12px',
            background: notifEnabled ? '#7c3aed' : '#e5e7eb',
            cursor: 'pointer', position: 'relative', transition: 'background 0.2s'
          }} onClick={() => {
            if (!notifEnabled) {
              Notification.requestPermission().then(p => setNotifEnabled(p === 'granted'));
            } else {
              setNotifEnabled(false);
            }
          }}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%', background: 'white',
              position: 'absolute', top: '3px',
              left: notifEnabled ? '23px' : '3px',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>Email Notifications</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Get updates via email</p>
          </div>
          <div style={{
            width: '44px', height: '24px', borderRadius: '12px',
            background: '#7c3aed', cursor: 'pointer', position: 'relative'
          }}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%', background: 'white',
              position: 'absolute', top: '3px', left: '23px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px', color: '#111827' }}>
          🔒 Change Password
        </h3>

        {pwError && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{pwError}</div>}
        {pwSuccess && <div className="alert alert-success" style={{ marginBottom: '12px' }}>{pwSuccess}</div>}

        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" value={pwForm.currentPassword}
              onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              placeholder="Enter current password" />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={pwForm.newPassword}
              onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
              placeholder="Minimum 6 characters" />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" value={pwForm.confirmPassword}
              onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              placeholder="Repeat new password" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={pwLoading}>
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ border: '1px solid #fecaca' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: '#dc2626' }}>
          ⚠️ Account Info
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
          Account created on: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
        </p>
        <p style={{ fontSize: '12px', color: '#9ca3af' }}>
          To delete your account, please contact support at admin@proprental.com
        </p>
      </div>
    </div>
  );
};

export default SettingsTab;