import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@cultiitr.in', password: 'admin123' });
    else setForm({ email: 'arjun@iitr.ac.in', password: 'user123' });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>AssetFlow</h1>
          <span>Cultural Council · IIT Roorkee</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => fillDemo('admin')}>Demo Admin</button>
          <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => fillDemo('user')}>Demo User</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" type="email" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} placeholder="you@iitr.ac.in" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#64748b' }}>
          New to AssetFlow? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}
