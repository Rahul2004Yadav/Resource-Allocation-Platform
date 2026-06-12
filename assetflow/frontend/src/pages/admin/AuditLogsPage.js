import React, { useEffect, useState } from 'react';
import API from '../../utils/api';

const ACTION_META = {
  ASSET_CREATED:    { label: 'Asset Created',    color: '#d1fae5', text: '#065f46' },
  ASSET_UPDATED:    { label: 'Asset Updated',    color: '#dbeafe', text: '#1e40af' },
  ASSET_DELETED:    { label: 'Asset Deleted',    color: '#fee2e2', text: '#991b1b' },
  BOOKING_CREATED:  { label: 'Booking Created',  color: '#ede9fe', text: '#5b21b6' },
  BOOKING_APPROVED: { label: 'Booking Approved', color: '#d1fae5', text: '#065f46' },
  BOOKING_REJECTED: { label: 'Booking Rejected', color: '#fee2e2', text: '#991b1b' },
  ASSET_ISSUED:     { label: 'Asset Issued',     color: '#dbeafe', text: '#1e40af' },
  ASSET_RETURNED:   { label: 'Asset Returned',   color: '#f3f4f6', text: '#374151' },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.get('/analytics/audit-logs', { params: { page, limit: 50 } })
      .then(r => { setLogs(r.data.logs); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">Audit Logs</div>
          <div className="page-subtitle">{total} total events recorded</div>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading">Loading logs...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const meta = ACTION_META[log.action] || { label: log.action, color: '#f3f4f6', text: '#374151' };
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ fontSize: 13 }}>{log.user_name || '—'}</td>
                      <td>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                          background: meta.color, color: meta.text, fontSize: 11, fontWeight: 600 }}>
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>
                        {log.entity_type} #{log.entity_id}
                      </td>
                      <td style={{ fontSize: 12, color: '#475569' }}>{log.details || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > 50 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
            <span style={{ fontSize: 13, color: '#64748b', padding: '5px 10px' }}>Page {page}</span>
            <button className="btn btn-ghost btn-sm" disabled={page * 50 >= total} onClick={() => setPage(p => p+1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
