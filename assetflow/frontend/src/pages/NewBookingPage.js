import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function NewBookingPage() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [form, setForm] = useState({ quantity: 1, purpose: '', start_date: '', end_date: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    API.get(`/assets/${assetId}`).then(r => setAsset(r.data.asset));
  }, [assetId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await API.post('/bookings', { asset_id: parseInt(assetId), ...form, quantity: parseInt(form.quantity) });
      setSuccess('Booking request submitted successfully! Awaiting admin approval.');
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally { setLoading(false); }
  };

  if (!asset) return <div className="loading">Loading asset details...</div>;

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="topbar">
        <div>
          <div className="page-title">Request Booking</div>
          <div className="page-subtitle">Submit a request for admin approval</div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ background: '#f0f4f8', borderRadius: 10, padding: '14px', fontSize: 28 }}>
            {asset.category === 'DSLR Camera' ? '📷' :
             asset.category === 'Audio Systems' ? '🎤' :
             asset.category === 'Studio Lighting' ? '💡' :
             asset.category === 'Costumes' ? '👗' :
             asset.category === 'Stage Props' ? '🎭' : '📦'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e3a5f' }}>{asset.name}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{asset.category}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span className={`badge badge-${asset.status}`}>{asset.status}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{asset.available_quantity} of {asset.total_quantity} available</span>
            </div>
            {asset.location && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>📍 {asset.location}</div>}
          </div>
        </div>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input className="form-control" type="date" min={today} value={form.start_date}
                onChange={e => setForm({...form, start_date: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input className="form-control" type="date" min={form.start_date || today} value={form.end_date}
                onChange={e => setForm({...form, end_date: e.target.value})} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input className="form-control" type="number" min={1} max={asset.available_quantity}
              value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Maximum: {asset.available_quantity} units</div>
          </div>

          <div className="form-group">
            <label className="form-label">Purpose / Event Name *</label>
            <textarea className="form-control" value={form.purpose}
              onChange={e => setForm({...form, purpose: e.target.value})}
              placeholder="Describe the event or purpose for which this asset is needed..."
              required rows={3} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-ghost" type="button" onClick={() => navigate(-1)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
              {loading ? 'Submitting...' : 'Submit Booking Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
