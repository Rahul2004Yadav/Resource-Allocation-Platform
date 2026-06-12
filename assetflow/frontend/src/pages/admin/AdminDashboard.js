import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import API from '../../utils/api';

const COLORS = ['#1e3a5f', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [utilization, setUtilization] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [trend, setTrend] = useState([]);
  const [activity, setActivity] = useState([]);
  const [overdue, setOverdue] = useState([]);

  useEffect(() => {
    API.get('/analytics/dashboard').then(r => setSummary(r.data.summary));
    API.get('/analytics/utilization').then(r => setUtilization(r.data.utilization));
    API.get('/analytics/category-breakdown').then(r => setBreakdown(r.data.breakdown));
    API.get('/analytics/booking-trend').then(r => setTrend(r.data.trend));
    API.get('/analytics/recent-activity').then(r => setActivity(r.data.activity));
    API.get('/analytics/overdue').then(r => setOverdue(r.data.overdue));
  }, []);

  if (!summary) return <div className="loading">Loading dashboard...</div>;

  const statCards = [
    { label: 'Total Assets', value: summary.total_assets, sub: `${summary.total_units} units`, bg: '#dbeafe', color: '#1e40af' },
    { label: 'Available Assets', value: summary.available_assets, sub: 'Ready to issue', bg: '#d1fae5', color: '#065f46' },
    { label: 'Pending Requests', value: summary.pending_bookings, sub: 'Needs review', bg: '#fef3c7', color: '#92400e', action: () => navigate('/admin/bookings') },
    { label: 'Active Bookings', value: summary.active_bookings, sub: 'Approved + Issued', bg: '#ede9fe', color: '#5b21b6' },
    { label: 'Overdue Returns', value: summary.overdue_bookings, sub: 'Action required', bg: '#fee2e2', color: '#991b1b' },
    { label: 'Total Users', value: summary.total_users, sub: 'Registered members', bg: '#f0fdf4', color: '#15803d' },
    { label: 'Due Today', value: summary.due_today, sub: 'Expected returns', bg: '#fff7ed', color: '#c2410c' },
  ];

  const ACTION_LABELS = {
    ASSET_CREATED: 'Asset created', ASSET_UPDATED: 'Asset updated', ASSET_DELETED: 'Asset deleted',
    BOOKING_CREATED: 'Booking requested', BOOKING_APPROVED: 'Booking approved', BOOKING_REJECTED: 'Booking rejected',
    ASSET_ISSUED: 'Asset issued', ASSET_RETURNED: 'Asset returned'
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">Admin Dashboard</div>
          <div className="page-subtitle">Cultural Council Asset Management · IIT Roorkee</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/assets')}>Manage Assets</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/bookings')}>
            {summary.pending_bookings > 0 ? `Review ${summary.pending_bookings} Pending` : 'View Bookings'}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card" onClick={s.action} style={{ cursor: s.action ? 'pointer' : 'default' }}>
            <div className="stat-icon" style={{ background: s.bg }}>
              <div style={{ width: 22, height: 22, borderRadius: 4, background: s.color, opacity: 0.8 }} />
            </div>
            <div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Bookings by Category</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={breakdown} dataKey="booking_count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({category, percent}) => `${category.split(' ')[0]} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Booking Trend (Last 30 Days)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1e3a5f" strokeWidth={2} dot={false} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset Utilization */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <span className="section-title">Asset Utilization (Top 10)</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={utilization.slice(0, 10)} layout="vertical" margin={{ left: 120, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
            <Tooltip />
            <Bar dataKey="total_bookings" fill="#1e3a5f" name="Total Bookings" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2">
        {/* Overdue */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Overdue Returns</span>
            {overdue.length > 0 && <span className="badge badge-overdue">{overdue.length}</span>}
          </div>
          {overdue.length === 0 ? (
            <div style={{ color: '#10b981', fontSize: 13, textAlign: 'center', padding: 20 }}>✅ No overdue items</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {overdue.slice(0, 5).map(o => (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{o.asset_name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{o.user_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#ef4444', fontWeight: 500, fontSize: 12 }}>Due: {o.due_date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Recent Activity</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/audit')}>View all</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activity.slice(0, 7).map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1e3a5f', marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500 }}>{a.user_name}</span>
                  <span style={{ color: '#64748b' }}> — {ACTION_LABELS[a.action] || a.action}</span>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(a.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
