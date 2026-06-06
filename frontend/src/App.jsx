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
import GoogleSuccess from './pages/GoogleSuccess';


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Navbar on EVERY page*/}
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/properties" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/google/success" element={<GoogleSuccess />} />
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/unauthorized" element={
            <div style={{ textAlign: 'center', marginTop: '80px' }}>
              <div style={{ fontSize: '48px' }}>🚫</div>
              <h2 style={{ marginTop: '16px' }}>Access Denied!</h2>
              <a href="/login" style={{ color: '#7c3aed', display: 'inline-block', marginTop: '12px' }}>
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