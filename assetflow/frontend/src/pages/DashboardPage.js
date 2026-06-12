import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const STATUS_COLORS = {
  pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444',
  issued: '#3b82f6', returned: '#6b7280', overdue: '#ef4444', cancelled: '#6b7280'
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/bookings').then(r => setBookings(r.data.bookings)).finally(() => setLoading(false));
  }, []);

  const counts = {
    pending: bookings.filter(b => b.status === 'pending').length,
    active: bookings.filter(b => ['approved','issued'].includes(b.status)).length,
    returned: bookings.filter(b => b.status === 'returned').length,
    overdue: bookings.filter(b => b.status === 'overdue').length,
  };

  const recent = bookings.slice(0, 8);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">Welcome back, {user?.name?.split(' ')[0]}</div>
          <div className="page-subtitle">{user?.department || 'Cultural Council'} · IIT Roorkee</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/assets')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Booking
        </button>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Pending Requests', value: counts.pending, color: '#fef3c7', icon: '⏳' },
          { label: 'Active Bookings', value: counts.active, color: '#dbeafe', icon: '📦' },
          { label: 'Returned', value: counts.returned, color: '#d1fae5', icon: '✅' },
          { label: 'Overdue', value: counts.overdue, color: '#fee2e2', icon: '⚠️' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.color, fontSize: 22 }}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-header">
            <span className="section-title">Recent Bookings</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/bookings')}>View all</button>
          </div>
          {loading ? <div className="loading">Loading...</div> : recent.length === 0 ? (
            <div className="empty-state">
              <p>No bookings yet. <a href="/assets">Browse assets</a> to get started.</p>
            </div>
          ) : (
            <div>
              {recent.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{b.asset_name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{b.start_date} → {b.end_date}</div>
                  </div>
                  <span className={`badge badge-${b.status}`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header"><span className="section-title">Quick Actions</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Browse Available Assets', desc: 'Find and request equipment', path: '/assets', emoji: '🔍' },
              { label: 'View My Bookings', desc: 'Track all your requests', path: '/bookings', emoji: '📋' },
              { label: 'Edit Profile', desc: 'Update your information', path: '/profile', emoji: '👤' },
            ].map(a => (
              <div key={a.path} onClick={() => navigate(a.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#f8fafc', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
                <span style={{ fontSize: 22 }}>{a.emoji}</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
