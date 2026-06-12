import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

const CONDITION_COLORS = { excellent: '#10b981', good: '#3b82f6', fair: '#f59e0b', poor: '#ef4444' };

export default function AssetsPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', available_only: false });

  useEffect(() => {
    API.get('/assets/categories').then(r => setCategories(r.data.categories));
  }, []);

  useEffect(() => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.available_only) params.available_only = 'true';
    API.get('/assets', { params }).then(r => setAssets(r.data.assets)).finally(() => setLoading(false));
  }, [filters]);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">Asset Inventory</div>
          <div className="page-subtitle">{assets.length} items found</div>
        </div>
      </div>

      <div className="search-bar">
        <input className="search-input" placeholder="Search assets by name, category, or description..."
          value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
        <select className="form-control" style={{ width: 180 }} value={filters.category}
          onChange={e => setFilters({...filters, category: e.target.value})}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={filters.available_only} onChange={e => setFilters({...filters, available_only: e.target.checked})} />
          Available only
        </label>
      </div>

      {loading ? <div className="loading">Loading assets...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {assets.map(asset => (
            <div key={asset.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1e3a5f', marginBottom: 3 }}>{asset.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{asset.category}</div>
                </div>
                <span className={`badge badge-${asset.status}`}>{asset.status}</span>
              </div>

              {asset.description && (
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{asset.description}</div>
              )}

              <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                <div style={{ background: '#f8fafc', borderRadius: 6, padding: '6px 10px', flex: 1 }}>
                  <div style={{ color: '#64748b' }}>Available</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: asset.available_quantity > 0 ? '#10b981' : '#ef4444' }}>
                    {asset.available_quantity}/{asset.total_quantity}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 6, padding: '6px 10px', flex: 1 }}>
                  <div style={{ color: '#64748b' }}>Condition</div>
                  <div style={{ fontWeight: 600, color: CONDITION_COLORS[asset.condition] || '#64748b', textTransform: 'capitalize' }}>
                    {asset.condition}
                  </div>
                </div>
                {asset.location && (
                  <div style={{ background: '#f8fafc', borderRadius: 6, padding: '6px 10px', flex: 1 }}>
                    <div style={{ color: '#64748b' }}>Location</div>
                    <div style={{ fontWeight: 500, fontSize: 11 }}>{asset.location.split(',')[0]}</div>
                  </div>
                )}
              </div>

              <button
                className={`btn ${asset.available_quantity > 0 && asset.status === 'available' ? 'btn-primary' : 'btn-ghost'}`}
                disabled={asset.available_quantity === 0 || asset.status !== 'available'}
                onClick={() => navigate(`/book/${asset.id}`)}
                style={{ justifyContent: 'center' }}>
                {asset.available_quantity > 0 && asset.status === 'available' ? 'Request Booking' : 'Unavailable'}
              </button>
            </div>
          ))}

          {assets.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <h3>No assets found</h3>
              <p>Try adjusting your search filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
