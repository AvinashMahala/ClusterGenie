// frontend/src/components/ClusterPanel.tsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClusterService } from '../services/clusterService';
import { ProvisioningService } from '../services/provisioningService';
import { DiagnosisPanel } from './DiagnosisPanel';
import type { Cluster, Droplet } from '../models';
import '../styles/ClusterPanel.scss';

const clusterService = new ClusterService();
const provisioningService = new ProvisioningService();

export function ClusterPanel() {
  const { id } = useParams<{ id: string }>();
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [droplets, setDroplets] = useState<Droplet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'droplets' | 'diagnosis'>('overview');

  useEffect(() => {
    if (id) {
      loadClusterData();
    }
  }, [id]);

  const loadClusterData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const [clusterData, allDroplets] = await Promise.all([
        clusterService.getCluster(id),
        provisioningService.listDroplets(),
      ]);

      setCluster(clusterData);

      // Filter droplets that belong to this cluster
      const clusterDroplets = allDroplets.filter(droplet =>
        clusterData.droplets.includes(droplet.id)
      );
      setDroplets(clusterDroplets);

    } catch (err) {
      console.error('Failed to load cluster data:', err);
      setError('Failed to load cluster data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'status-healthy';
      case 'warning': return 'status-warning';
      case 'critical': return 'status-critical';
      default: return 'status-unknown';
    }
  };

  if (loading) {
    return (
      <div className="cluster-panel">
        <div className="loading">Loading cluster...</div>
      </div>
    );
  }

  if (error || !cluster) {
    return (
      <div className="cluster-panel">
        <div className="error">
          <h2>Error</h2>
          <p>{error || 'Cluster not found'}</p>
          <Link to="/" className="back-link">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cluster-panel">
      {/* Header */}
      <div className="cluster-header">
        <div className="cluster-info">
          <h1>{cluster.name}</h1>
          <div className="cluster-meta">
            <span className="cluster-id">ID: {cluster.id}</span>
            <span className="cluster-region">Region: {cluster.region}</span>
            <span className={`cluster-status ${getStatusColor(cluster.status)}`}>
              {cluster.status}
            </span>
          </div>
        </div>
        <Link to="/" className="back-link">← Back to Dashboard</Link>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'droplets' ? 'active' : ''}`}
          onClick={() => setActiveTab('droplets')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
          Droplets ({droplets.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'diagnosis' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnosis')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Diagnosis
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Droplets</h3>
                <div className="stat-value">{droplets.length}</div>
              </div>
              <div className="stat-card">
                <h3>Active Droplets</h3>
                <div className="stat-value">
                  {droplets.filter(d => d.status === 'active').length}
                </div>
              </div>
              <div className="stat-card">
                <h3>Region</h3>
                <div className="stat-value">{cluster.region}</div>
              </div>
              <div className="stat-card">
                <h3>Last Checked</h3>
                <div className="stat-value">
                  {new Date(cluster.lastChecked).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <Link to="/provisioning" className="action-button primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Droplet
                </Link>
                <button
                  className="action-button secondary"
                  onClick={() => setActiveTab('diagnosis')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Run Diagnosis
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'droplets' && (
          <div className="droplets-tab">
            <div className="droplets-header">
              <h3>Cluster Droplets</h3>
              <Link to="/provisioning" className="add-droplet-link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Droplet
              </Link>
            </div>

            {droplets.length === 0 ? (
              <div className="empty-state">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                <h3>No droplets in this cluster</h3>
                <p>Get started by provisioning your first droplet.</p>
                <Link to="/provisioning" className="action-button primary">
                  Create First Droplet
                </Link>
              </div>
            ) : (
              <div className="droplets-grid">
                {droplets.map(droplet => (
                  <div key={droplet.id} className="droplet-card">
                    <div className="droplet-header">
                      <h4>{droplet.name}</h4>
                      <span className={`droplet-status ${droplet.status}`}>
                        {droplet.status}
                      </span>
                    </div>
                    <div className="droplet-details">
                      <div className="detail-item">
                        <span className="label">Size:</span>
                        <span className="value">{droplet.size}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Image:</span>
                        <span className="value">{droplet.image}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Region:</span>
                        <span className="value">{droplet.region}</span>
                      </div>
                      {droplet.ipAddress && (
                        <div className="detail-item">
                          <span className="label">IP:</span>
                          <span className="value">{droplet.ipAddress}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="label">Created:</span>
                        <span className="value">
                          {new Date(droplet.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'diagnosis' && (
          <div className="diagnosis-tab">
            <DiagnosisPanel clusterId={cluster.id} />
          </div>
        )}
      </div>
    </div>
  );
}