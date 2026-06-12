import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setError(''); setLoading(true);
    try {
      await API.put('/auth/profile', form);
      setMsg('Profile updated successfully');
      setForm(f => ({ ...f, currentPassword: '', newPassword: '' }));
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally { setLoading(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="page-title" style={{ marginBottom: 20 }}>Profile Settings</div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e8a020', fontWeight: 800, fontSize: 22 }}>{initials}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{user?.name}</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>{user?.email}</div>
          <span className={`badge badge-${user?.role === 'admin' ? 'approved' : 'issued'}`} style={{ marginTop: 4 }}>{user?.role}</span>
        </div>
      </div>

      <div className="card">
        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" value={user?.email} disabled style={{ background: '#f8fafc' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Department / Section</label>
            <input className="form-control" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Music Section" />
          </div>

          <div className="divider" />
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#475569' }}>Change Password (optional)</div>

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-control" type="password" value={form.currentPassword} onChange={e => setForm({...form, currentPassword: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-control" type="password" value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})} minLength={6} />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center', width: '100%' }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
