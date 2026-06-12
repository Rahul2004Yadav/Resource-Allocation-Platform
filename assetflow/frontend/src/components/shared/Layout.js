import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  assets: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  bookings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
  analytics: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  audit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const userNav = [
    { path: '/dashboard', label: 'Dashboard', icon: Icons.dashboard },
    { path: '/assets', label: 'Browse Assets', icon: Icons.assets },
    { path: '/bookings', label: 'My Bookings', icon: Icons.bookings },
    { path: '/profile', label: 'Profile', icon: Icons.profile },
  ];

  const adminNav = [
    { path: '/admin', label: 'Dashboard', icon: Icons.dashboard },
    { path: '/admin/assets', label: 'Manage Assets', icon: Icons.assets },
    { path: '/admin/bookings', label: 'All Bookings', icon: Icons.bookings },
    { path: '/admin/audit', label: 'Audit Logs', icon: Icons.audit },
    { path: '/assets', label: 'Asset Browser', icon: Icons.analytics },
    { path: '/profile', label: 'Profile', icon: Icons.profile },
  ];

  const navItems = user?.role === 'admin' ? adminNav : userNav;

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>AssetFlow</h2>
          <span>Cultural Council · IITR</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">{user?.role === 'admin' ? 'Administration' : 'Navigation'}</div>
          {navItems.map(item => (
            <div
              key={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <strong>{user?.name}</strong>
              <span>{user?.role === 'admin' ? 'Administrator' : user?.department || 'Member'}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={logout}>Sign out</button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
