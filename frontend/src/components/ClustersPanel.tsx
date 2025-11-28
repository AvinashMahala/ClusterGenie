// frontend/src/components/ClustersPanel.tsx

import { useState, useEffect } from 'react';
import { ClusterService } from '../services/clusterService';
import type { Cluster } from '../models/cluster';
import TabularSection, { type Column, type FilterOption } from './TabularSection';
import { StatusBadge } from './common';
import './ClustersPanel.scss';

const clusterService = new ClusterService();

export function ClustersPanel() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClusters = async () => {
    setLoading(true);
    try {
      const clusterList = await clusterService.listClusters();
      setClusters(clusterList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clusters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
  }, []);

  const statusFilterOptions: FilterOption[] = [
    { value: 'healthy', label: 'Healthy' },
    { value: 'warning', label: 'Warning' },
    { value: 'critical', label: 'Critical' }
  ];

  const columns: Column<Cluster>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, cluster) => (
        <div className="cluster-name-cell">
          <div className="cluster-name">{value}</div>
          <div className="cluster-id">ID: {cluster.id}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      className: 'status-cell',
      render: (value) => <StatusBadge status={value as string} />
    },
    {
      key: 'region',
      label: 'Region',
      sortable: true
    },
    {
      key: 'droplets',
      label: 'Droplets',
      render: (value) => Array.isArray(value) ? value.length : 0
    },
    {
      key: 'lastChecked',
      label: 'Last Checked',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleString()
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'actions-cell',
      render: (_, cluster) => (
        <div className="action-buttons">
          <button
            className="action-btn action-view"
            title="View Details"
            onClick={() => window.location.href = `/clusters/${cluster.id}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="clusters-panel">
      <TabularSection
        title="Clusters"
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        }
        count={clusters.length}
        actions={
          <button
            className="refresh-btn"
            onClick={loadClusters}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        }
        columns={columns}
        data={clusters}
        searchPlaceholder="Search clusters..."
        filterOptions={statusFilterOptions}
        filterKey="status"
        emptyStateTitle="No clusters found"
        emptyStateDescription="Create your first cluster to get started"
        emptyStateIcon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        }
      />
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
    </div>
  );
}