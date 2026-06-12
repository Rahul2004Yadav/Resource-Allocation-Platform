import React, { useEffect, useState } from 'react';
import API from '../../utils/api';

function ActionModal({ booking, onClose, onDone }) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(null);

  const perform = async (act) => {
    setLoading(true);
    try {
      await API.put(`/bookings/${booking.id}/${act}`, { admin_note: note, condition_note: note });
      onDone();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    } finally { setLoading(false); }
  };

  const canApprove = booking.status === 'pending';
  const canReject = ['pending', 'approved'].includes(booking.status);
  const canIssue = booking.status === 'approved';
  const canReturn = ['issued', 'overdue'].includes(booking.status);

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Manage Booking #{booking.id}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '14px', marginBottom: 16, fontSize: 13 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{booking.asset_name}</div>
          <div style={{ color: '#64748b' }}><strong>Requested by:</strong> {booking.user_name} ({booking.department})</div>
          <div style={{ color: '#64748b' }}><strong>Dates:</strong> {booking.start_date} → {booking.end_date}</div>
          <div style={{ color: '#64748b' }}><strong>Qty:</strong> {booking.quantity}</div>
          <div style={{ color: '#64748b' }}><strong>Purpose:</strong> {booking.purpose}</div>
          <div style={{ marginTop: 8 }}><span className={`badge badge-${booking.status}`}>{booking.status}</span></div>
        </div>

        <div className="form-group">
          <label className="form-label">Admin Note (optional)</label>
          <textarea className="form-control" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note for the user..." rows={2} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {canApprove && <button className="btn btn-success" disabled={loading} onClick={() => perform('approve')}>✓ Approve</button>}
          {canReject && <button className="btn btn-danger" disabled={loading} onClick={() => perform('reject')}>✗ Reject</button>}
          {canIssue && <button className="btn btn-primary" disabled={loading} onClick={() => perform('issue')}>Issue Asset</button>}
          {canReturn && <button className="btn btn-accent" disabled={loading} onClick={() => perform('return')}>Mark Returned</button>}
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);

  const load = () => {
    const params = filter ? { status: filter } : {};
    API.get('/bookings', { params }).then(r => setBookings(r.data.bookings)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const counts = {};
  const statuses = ['', 'pending', 'approved', 'issued', 'returned', 'overdue', 'rejected', 'cancelled'];

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">Booking Management</div>
          <div className="page-subtitle">Review, approve, issue, and track all asset bookings</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => API.post('/bookings/mark-overdue').then(load)}>
          Sync Overdue
        </button>
      </div>

      <div className="tabs">
        {statuses.map(s => (
          <div key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </div>
        ))}
      </div>

      <div className="card">
        {loading ? <div className="loading">Loading bookings...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Asset</th>
                  <th>Requested By</th>
                  <th>Purpose</th>
                  <th>Dates</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>{b.id}</td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{b.asset_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{b.asset_category}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{b.user_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{b.department}</div>
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      <div style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.purpose}</div>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {b.start_date}<br/><span style={{ color: '#94a3b8' }}>{b.end_date}</span>
                      {b.status === 'issued' && b.due_date && <div style={{ color: '#e8a020', fontWeight: 600, fontSize: 11 }}>Due: {b.due_date}</div>}
                    </td>
                    <td style={{ fontWeight: 600, textAlign: 'center' }}>{b.quantity}</td>
                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                    <td>
                      {!['returned', 'cancelled', 'rejected'].includes(b.status) && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelected(b)}>Manage</button>
                      )}
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr><td colSpan={8}><div className="empty-state">No bookings found for this filter</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <ActionModal booking={selected} onClose={() => setSelected(null)} onDone={() => { setSelected(null); load(); }} />
      )}
    </div>
  );
}
