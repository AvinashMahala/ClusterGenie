// frontend/src/components/ClustersPanel.tsx (new)

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ClusterService } from '../services/clusterService';
import type { Cluster } from '../models/cluster';
import { Input } from './common/Input';
import { Select } from './common/Select';
import { StatusBadge } from './common';
import '../styles/buttons.scss';
import './ClustersPanel.scss';

const clusterService = new ClusterService();

const REGION_OPTIONS = [
  { value: 'nyc1', label: 'New York (nyc1)' },
  { value: 'sfo3', label: 'San Francisco (sfo3)' },
  { value: 'ams3', label: 'Amsterdam (ams3)' },
  { value: 'lon1', label: 'London (lon1)' },
];

const STATUS_OPTIONS = [
  { value: 'healthy', label: 'Healthy' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];

export function ClustersPanel() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'warning' | 'critical'>('all');
  const [sortKey, setSortKey] = useState<'name' | 'region' | 'lastChecked'>('name');
  const [editingClusterId, setEditingClusterId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    region: 'nyc1',
    status: 'healthy' as Cluster['status'],
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await clusterService.listClusters();
      setClusters(list || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const startEditing = (cluster: Cluster) => {
    setEditingClusterId(cluster.id);
    setEditForm({
      name: cluster.name,
      region: cluster.region,
      status: cluster.status,
    });
    setEditError(null);
  };

  const cancelEditing = () => {
    setEditingClusterId(null);
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editingClusterId) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await clusterService.updateCluster(editingClusterId, {
        name: editForm.name,
        region: editForm.region,
        status: editForm.status,
      });
      await load();
      cancelEditing();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update cluster');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteCluster = async (clusterId: string) => {
    if (!window.confirm('Delete this cluster? This cannot be undone.')) {
      return;
    }
    try {
      await clusterService.deleteCluster(clusterId);
      await load();
      if (editingClusterId === clusterId) {
        cancelEditing();
      }
    } catch (err) {
      console.error('Failed to delete cluster:', err);
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clusters
      .filter(c => statusFilter === 'all' ? true : c.status === statusFilter)
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q));
  }, [clusters, query, statusFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'region') return a.region.localeCompare(b.region);
      // lastChecked - newest first
      const ta = a.lastChecked ? new Date(a.lastChecked).getTime() : 0;
      const tb = b.lastChecked ? new Date(b.lastChecked).getTime() : 0;
      return tb - ta;
    });
    return arr;
  }, [filtered, sortKey]);

  const counts = useMemo(() => ({
    healthy: clusters.filter(c => c.status === 'healthy').length,
    warning: clusters.filter(c => c.status === 'warning').length,
    critical: clusters.filter(c => c.status === 'critical').length,
  }), [clusters]);

  const statusCards = useMemo(() => {
    const cards: Array<{
      key: 'all' | 'healthy' | 'warning' | 'critical';
      label: string;
      icon: string;
      copy: string;
      tooltip: string;
      trendChips: string[];
      sparkline: number[];
      filterLabel: string;
      count: number;
    }> = [
      {
        key: 'healthy',
        label: 'Healthy',
        icon: '✔︎',
        copy: `${counts.healthy} clusters running without alerts`,
        tooltip: 'Clusters reporting no active issues',
        trendChips: ['2 events resolved today', 'Stable for 3+ hours'],
        sparkline: [70, 80, 75, 85, 90],
        filterLabel: 'Show only healthy',
        count: counts.healthy,
      },
      {
        key: 'warning',
        label: 'Warning',
        icon: '⚠',
        copy: `${counts.warning} clusters degraded in the last hour`,
        tooltip: 'Clusters with warning-level alerts',
        trendChips: ['2 clusters need scaling', 'Avg latency +14%'],
        sparkline: [30, 35, 40, 38, 45],
        filterLabel: 'Show only warning',
        count: counts.warning,
      },
      {
        key: 'critical',
        label: 'Critical',
        icon: '✖',
        copy: `${counts.critical} clusters require immediate attention`,
        tooltip: 'Clusters with critical or failing jobs',
        trendChips: ['1 outage ongoing', 'Investigating errors'],
        sparkline: [10, 15, 8, 12, 5],
        filterLabel: 'Show only critical',
        count: counts.critical,
      },
      {
        key: 'all',
        label: 'Fleet total',
        icon: '#',
        copy: `${clusters.length} clusters tracked`,
        tooltip: 'Roll-up of every cluster in the fleet',
        trendChips: ['4 deployments today', '1 incident closed'],
        sparkline: [50, 60, 55, 60, 58],
        filterLabel: 'Reset filters',
        count: clusters.length,
      },
    ];

    return cards;
  }, [counts, clusters.length]);

  function handleCardFilter(key: 'all' | 'healthy' | 'warning' | 'critical') {
    setStatusFilter(prev => (prev === key && key !== 'all') ? 'all' : key);
  }

  return (
    <div className="clusters-page">
      <header className="clusters-header">
        <div>
          <h1>Clusters</h1>
        </div>

        <div className="header-actions">
          <button className="btn btn-ghost" onClick={load} disabled={loading} title="Refresh">
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link to="/clusters/new" className="btn btn-primary">Create cluster</Link>
        </div>
      </header>

      {editingClusterId && (
        <section className="edit-cluster-panel">
          <div className="edit-cluster-header">
            <div>
              <p className="eyebrow">Editing cluster</p>
              <h2>{editForm.name || 'Untitled cluster'}</h2>
              <p className="subtitle">Adjust metadata or status to keep the dashboard accurate.</p>
            </div>
            <button type="button" className="link" onClick={cancelEditing}>Cancel</button>
          </div>

          <div className="edit-fields">
            <Input
              label="Cluster name"
              value={editForm.name}
              onChange={event => setEditForm(prev => ({ ...prev, name: event.target.value }))}
            />
            <Select
              label="Region"
              value={editForm.region}
              options={REGION_OPTIONS}
              onChange={event => setEditForm(prev => ({ ...prev, region: event.target.value }))}
            />
            <Select
              label="Status"
              value={editForm.status}
              options={STATUS_OPTIONS}
              onChange={event => setEditForm(prev => ({ ...prev, status: event.target.value as Cluster['status'] }))}
            />
          </div>

          <div className="edit-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleEditSave}
              disabled={editLoading}
            >
              {editLoading ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={cancelEditing}>
              Cancel
            </button>
          </div>

          {editError && <p className="edit-error">{editError}</p>}
        </section>
      )}

      <section className="status-card-grid">
        {statusCards.map(card => (
          <article
            key={card.key}
            className={`status-card status-card-${card.key}`}
            title={card.tooltip}
          >
            <div className="status-card-header">
              <div>
                <p className="status-card-label">{card.label}</p>
                <p className="status-card-count">{card.count}</p>
              </div>
              <span className="status-card-icon" aria-hidden="true">{card.icon}</span>
            </div>

            <p className="status-card-copy">{card.copy}</p>

            <div className="status-card-trend">
              {card.trendChips.map(chip => (
                <span key={chip} className="trend-chip">{chip}</span>
              ))}
            </div>

            <div className="sparkline" aria-hidden="true">
              {card.sparkline.map((value, index) => (
                <span key={index} style={{ height: `${value}%` }} />
              ))}
            </div>

            <div className="status-card-footer">
              <button
                type="button"
                className={`filter-chip${statusFilter === card.key ? ' active' : ''}`}
                aria-pressed={statusFilter === card.key}
                onClick={() => handleCardFilter(card.key)}
              >
                {card.filterLabel}
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="clusters-list-wrap">
        <div className="list-toolbar">
          <div className="search">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or region"
            />
          </div>

          <div className="controls">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
              <option value="all">All status</option>
              <option value="healthy">Healthy</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>

            <select value={sortKey} onChange={e => setSortKey(e.target.value as any)}>
              <option value="name">Sort: Name</option>
              <option value="region">Sort: Region</option>
              <option value="lastChecked">Sort: Recent</option>
            </select>
          </div>
        </div>

        <div className="table-area">
          {error && <div className="error">Error loading clusters — {error}</div>}

          {!loading && sorted.length === 0 && (
            <div className="empty">No clusters match your filters.</div>
          )}

          <table className="clusters-table" role="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Region</th>
                <th>Status</th>
                <th>Droplets</th>
                <th>Last checked</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => (
                <tr key={c.id}>
                  <td className="cell-name">
                    <div className="name-main">{c.name}</div>
                    <div className="name-sub">{c.id}</div>
                  </td>
                  <td>{c.region}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="center">{c.droplets ? c.droplets.length : 0}</td>
                  <td className="muted">{c.lastChecked ? new Date(c.lastChecked).toLocaleString() : '—'}</td>
                  <td className="actions">
                    <Link to={`/clusters/${c.id}`} className="btn btn-small btn-view">View</Link>
                    <button
                      type="button"
                      className="btn btn-small btn-ghost"
                      onClick={() => startEditing(c)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => handleDeleteCluster(c.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

