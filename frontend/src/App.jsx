import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import PropertyList from './pages/PropertyList';
import PropertyDetail from './pages/PropertyDetail';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes — Navbar dikhega */}
          <Route path="/" element={<Navigate to="/properties" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/properties" element={<><Navbar /><PropertyList /></>} />
          <Route path="/properties/:id" element={<><Navbar /><PropertyDetail /></>} />

          {/* User Dashboard — Sidebar hoga */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserDashboard />
            </ProtectedRoute>
          } />

          {/* Admin Dashboard — Sidebar hoga */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Unauthorized */}
          <Route path="/unauthorized" element={
            <div style={{ textAlign: 'center', marginTop: '80px' }}>
              <div style={{ fontSize: '48px' }}>🚫</div>
              <h2 style={{ marginTop: '16px' }}>Access Denied!</h2>
              <p style={{ color: '#6b7280', marginTop: '8px' }}>
                You don't have permission to access this page.
              </p>
              <a href="/login" style={{ color: '#7c3aed', marginTop: '16px', display: 'inline-block' }}>
                Go to Login
              </a>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;