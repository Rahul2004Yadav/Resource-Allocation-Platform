import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['Music Section', 'Dance Section', 'Photography Section', 'Drama Section', 'Fine Arts', 'Literary Section', 'Quiz Club', 'Film & Media', 'Event Management', 'Other'];

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.department);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>AssetFlow</h1>
          <span>Create your account</span>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-control" type="text" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} placeholder="Your full name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" type="email" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} placeholder="you@iitr.ac.in" required />
          </div>
          <div className="form-group">
            <label className="form-label">Department / Section</label>
            <select className="form-control" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
              <option value="">Select your section</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} placeholder="Minimum 6 characters" required minLength={6} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#64748b' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
