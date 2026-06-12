import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import Layout from './components/shared/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import BookingsPage from './pages/BookingsPage';
import NewBookingPage from './pages/NewBookingPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAssets from './pages/admin/AdminAssets';
import AdminBookings from './pages/admin/AdminBookings';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import ProfilePage from './pages/ProfilePage';

function PrivateRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />} />

      {/* User routes */}
      <Route path="/dashboard" element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
      <Route path="/assets" element={<PrivateRoute><Layout><AssetsPage /></Layout></PrivateRoute>} />
      <Route path="/bookings" element={<PrivateRoute><Layout><BookingsPage /></Layout></PrivateRoute>} />
      <Route path="/book/:assetId" element={<PrivateRoute><Layout><NewBookingPage /></Layout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Layout><ProfilePage /></Layout></PrivateRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<PrivateRoute adminOnly><Layout><AdminDashboard /></Layout></PrivateRoute>} />
      <Route path="/admin/assets" element={<PrivateRoute adminOnly><Layout><AdminAssets /></Layout></PrivateRoute>} />
      <Route path="/admin/bookings" element={<PrivateRoute adminOnly><Layout><AdminBookings /></Layout></PrivateRoute>} />
      <Route path="/admin/audit" element={<PrivateRoute adminOnly><Layout><AuditLogsPage /></Layout></PrivateRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
