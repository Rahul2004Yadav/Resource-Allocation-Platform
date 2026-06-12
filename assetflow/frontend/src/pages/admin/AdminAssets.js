import React, { useEffect, useState } from 'react';
import API from '../../utils/api';

const CATEGORIES = ['DSLR Camera', 'Studio Lighting', 'Audio Systems', 'Costumes', 'Stage Props', 'Recording Equipment', 'Event Infrastructure', 'Other'];
const STATUSES = ['available', 'maintenance', 'retired'];
const CONDITIONS = ['excellent', 'good', 'fair', 'poor'];

function AssetModal({ asset, onClose, onSave }) {
  const [form, setForm] = useState(asset || { name: '', category: '', description: '', total_quantity: 1, status: 'available', condition: 'good', location: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (asset) {
        await API.put(`/assets/${asset.id}`, form);
      } else {
        await API.post('/assets', form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{asset ? 'Edit Asset' : 'Add New Asset'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Asset Name *</label>
            <input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Total Quantity *</label>
              <input className="form-control" type="number" min={1} value={form.total_quantity} onChange={e => setForm({...form, total_quantity: e.target.value})} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Condition</label>
              <select className="form-control" value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Storage Location</label>
            <input className="form-control" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Media Room, SAC" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" type="button" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
              {loading ? 'Saving...' : (asset ? 'Update Asset' : 'Add Asset')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QRModal({ asset, onClose }) {
  const [qr, setQr] = useState(null);
  useEffect(() => {
    API.get(`/assets/${asset.id}/qrcode`).then(r => setQr(r.data.qr_code));
  }, [asset.id]);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 340, textAlign: 'center' }}>
        <div className="modal-header">
          <span className="modal-title">QR Code</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ fontWeight: 500, marginBottom: 12 }}>{asset.name}</div>
        {qr ? <img src={qr} alt="QR Code" style={{ width: 220, height: 220 }} /> : <div>Generating...</div>}
        {qr && <a href={qr} download={`${asset.name}-qr.png`} className="btn btn-primary" style={{ marginTop: 16, justifyContent: 'center', width: '100%' }}>Download QR</a>}
        <button className="btn btn-ghost" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function AdminAssets() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', status: '' });
  const [editAsset, setEditAsset] = useState(undefined);
  const [qrAsset, setQrAsset] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.status) params.status = filters.status;
    API.get('/assets', { params }).then(r => setAssets(r.data.assets)).finally(() => setLoading(false));
  };

  useEffect(() => {
    API.get('/assets/categories').then(r => setCategories(r.data.categories));
  }, []);
  useEffect(() => { load(); }, [filters]);

  const handleDelete = async () => {
    await API.delete(`/assets/${deleteId}`);
    setDeleteId(null); load();
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">Manage Assets</div>
          <div className="page-subtitle">{assets.length} assets in inventory</div>
        </div>
        <button className="btn btn-primary" onClick={() => setEditAsset(null)}>+ Add Asset</button>
      </div>

      <div className="search-bar">
        <input className="search-input" placeholder="Search assets..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
        <select className="form-control" style={{ width: 160 }} value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-control" style={{ width: 130 }} value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? <div className="loading">Loading assets...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Category</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th>Condition</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>#{a.id}</div>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{a.category}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: a.available_quantity === 0 ? '#ef4444' : '#10b981' }}>
                        {a.available_quantity}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>/{a.total_quantity}</span>
                    </td>
                    <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                    <td style={{ fontSize: 12, textTransform: 'capitalize', color: '#64748b' }}>{a.condition}</td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{a.location?.split(',')[0]}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setQrAsset(a)} title="QR Code">QR</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditAsset(a)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(a.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && <tr><td colSpan={7}><div className="empty-state">No assets found</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editAsset !== undefined && (
        <AssetModal asset={editAsset || undefined} onClose={() => setEditAsset(undefined)} onSave={() => { setEditAsset(undefined); load(); }} />
      )}
      {qrAsset && <QRModal asset={qrAsset} onClose={() => setQrAsset(null)} />}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header"><span className="modal-title">Confirm Delete</span></div>
            <p style={{ fontSize: 14, color: '#475569', marginBottom: 20 }}>This will permanently remove the asset and its booking history.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={handleDelete}>Delete Asset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
