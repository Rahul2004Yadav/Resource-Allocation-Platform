import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function BookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [cancelId, setCancelId] = useState(null);

  const load = () => {
    const params = filter ? { status: filter } : {};
    API.get('/bookings', { params }).then(r => setBookings(r.data.bookings)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const cancelBooking = async (id) => {
    await API.put(`/bookings/${id}/cancel`);
    load();
    setCancelId(null);
  };

  const statuses = ['', 'pending', 'approved', 'rejected', 'issued', 'returned', 'overdue', 'cancelled'];

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">My Bookings</div>
          <div className="page-subtitle">Track all your asset requests</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/assets')}>+ New Request</button>
      </div>

      <div className="tabs">
        {statuses.map(s => (
          <div key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </div>
        ))}
      </div>

      {loading ? <div className="loading">Loading...</div> : bookings.length === 0 ? (
        <div className="empty-state">
          <h3>No bookings found</h3>
          <p>You haven't made any booking requests yet.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/assets')}>Browse Assets</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bookings.map(b => (
            <div key={b.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: '#1e3a5f' }}>{b.asset_name}</span>
                    <span className={`badge badge-${b.status}`}>{b.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {b.asset_category} · Qty: {b.quantity} · {b.start_date} → {b.end_date}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                    <strong>Purpose:</strong> {b.purpose}
                  </div>
                  {b.admin_note && (
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, padding: '6px 10px', background: '#f8fafc', borderRadius: 6, borderLeft: '3px solid #e2e8f0' }}>
                      <strong>Admin note:</strong> {b.admin_note}
                    </div>
                  )}
                  {b.status === 'issued' && b.due_date && (
                    <div style={{ fontSize: 12, color: '#92400e', marginTop: 4, fontWeight: 500 }}>
                      ⏰ Return due: {b.due_date}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>#{b.id} · {new Date(b.created_at).toLocaleDateString()}</div>
                  {['pending', 'approved'].includes(b.status) && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setCancelId(b.id)}>Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cancelId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <span className="modal-title">Cancel Booking</span>
              <button className="modal-close" onClick={() => setCancelId(null)}>×</button>
            </div>
            <p style={{ fontSize: 14, color: '#475569', marginBottom: 20 }}>Are you sure you want to cancel this booking request?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setCancelId(null)}>Keep it</button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => cancelBooking(cancelId)}>Cancel Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
