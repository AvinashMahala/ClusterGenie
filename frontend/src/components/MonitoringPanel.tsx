// frontend/src/components/MonitoringPanel.tsx

import { useState, useEffect } from 'react';
import { MonitoringService } from '../services/monitoringService';
import type { Metric, MetricsResponse } from '../models/metric';
import { Panel, PanelHeader, PanelContent, Card, CardHeader, CardContent, Select, ActionButton, Alert, LoadingSpinner } from './common';
import { ClusterRepositoryImpl } from '../repositories/clusterRepository';
import type { Cluster } from '../models/cluster';
import './MonitoringPanel.scss';

const monitoringService = new MonitoringService();

export function MonitoringPanel() {
  const [clusterId, setClusterId] = useState('');
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedType, setSelectedType] = useState<Metric['type'] | ''>('');
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    // allow listing across all clusters when clusterId is empty
    if (clusterId !== '' && !clusterId.trim()) {
      setError('Please choose a cluster');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await monitoringService.getMetrics(clusterId.trim(), selectedType || undefined, page, pageSize);
      setMetrics(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [clusterId, selectedType, page, pageSize]);

  useEffect(() => {
    // fetch clusters list for the dropdown
    const repo = new ClusterRepositoryImpl();
    repo.listClusters().then((c) => {
      setClusters(c || []);
      if (c && c.length && !clusterId) {
        // default to first cluster if none selected yet
        setClusterId(c[0].id);
      }
    }).catch(() => {
      // ignore - we'll allow manual cluster selection via text if cluster list unavailable
    });
  }, []);

  const getMetricColor = (type: string) => {
    switch (type) {
      case 'cpu':
        return 'text-blue-600';
      case 'memory':
        return 'text-green-600';
      case 'disk':
        return 'text-yellow-600';
      case 'network':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'Mbps') {
      return `${value.toFixed(2)} Mbps`;
    }
    return `${value.toFixed(2)} ${unit}`;
  };

  const getLatestMetrics = () => {
    if (!metrics?.metrics.length) return {};

    const latestByType: Record<string, Metric> = {};
    metrics.metrics.forEach(metric => {
      const existing = latestByType[metric.type];
      if (!existing || metric.timestamp > existing.timestamp) {
        latestByType[metric.type] = metric;
      }
    });

    return latestByType;
  };

  const latestMetrics = getLatestMetrics();

  return (
    <Panel>
      <PanelHeader
        title="Cluster Monitoring"
        subtitle="Real-time performance metrics and analytics"
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />

      <PanelContent>
        <div className="monitoring-controls">
          <Select
            label="Cluster"
            value={clusterId}
            onChange={(e) => setClusterId(e.target.value)}
            options={[{ value: '', label: 'All Clusters' }, ...(clusters.map(cl => ({ value: cl.id, label: cl.name || cl.id }))) ]}
          />

          <Select
            label="Metric Type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as Metric['type'] | '')}
            options={[
              { value: '', label: 'All Types' },
              { value: 'cpu', label: 'CPU' },
              { value: 'memory', label: 'Memory' },
              { value: 'disk', label: 'Disk' },
              { value: 'network', label: 'Network' }
            ]}
          />

          <div className="control-actions">
            <ActionButton
              onClick={loadMetrics}
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Refresh'}
            </ActionButton>
          </div>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* Current Metrics Summary */}
        {Object.keys(latestMetrics).length > 0 && (
          <Card>
            <CardHeader title="Current Metrics" />
            <CardContent>
              <div className="metrics-grid">
                {Object.entries(latestMetrics).map(([type, metric]) => (
                  <div key={type} className="metric-item">
                    <div className={`metric-value ${getMetricColor(type)}`}>
                      {formatValue(metric.value, metric.unit)}
                    </div>
                    <div className="metric-label">{type}</div>
                    <div className="metric-time">
                      {metric.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metrics History */}
        {metrics && metrics.metrics.length > 0 && (
          <Card>
            <CardHeader title={`Metrics History (${metrics.period})`} />
            <CardContent>
              <div className="metrics-table-container">
                <table className="metrics-table">
                  <thead>
                    <tr>
                      <th>Cluster</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.metrics.map((metric) => (
                      <tr key={`${metric.id}-${metric.timestamp.getTime()}`}>
                        <td>
                          <div className="cluster-cell">
                            <div className="cluster-id">{metric.clusterId || 'unknown'}</div>
                          </div>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{metric.type}</td>
                        <td>{formatValue(metric.value, metric.unit)}</td>
                        <td>{metric.timestamp.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                {/* Pagination controls */}
                <div className="metrics-pagination">
                  <div className="page-controls">
                    <ActionButton onClick={() => setPage(1)} disabled={(metrics.page || page) <= 1}>
                      « First
                    </ActionButton>
                    <ActionButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={(metrics.page || page) <= 1}>
                      ‹ Prev
                    </ActionButton>

                    <div className="page-info">
                      {(() => {
                        const current = metrics.page || page;
                        const size = metrics.page_size || pageSize;
                        const total = metrics.total_count ?? (metrics.total || 0);
                        const start = total === 0 ? 0 : (current - 1) * size + 1;
                        const end = Math.min(total, current * size);
                        const totalPages = Math.max(1, Math.ceil((total || 0) / size));

                        return (`Showing ${start}-${end} of ${total} — Page ${current} / ${totalPages}`);
                      })()}
                    </div>

                    <ActionButton onClick={() => setPage((p) => p + 1)} disabled={(metrics.page || page) * (metrics.page_size || pageSize) >= (metrics.total_count || (metrics.total || 0))}>
                      Next ›
                    </ActionButton>
                    <ActionButton onClick={() => setPage(Math.max(1, Math.ceil(((metrics.total_count || (metrics.total || 0)) / (metrics.page_size || pageSize)) || 1)))} disabled={(metrics.page || page) * (metrics.page_size || pageSize) >= (metrics.total_count || (metrics.total || 0))}>
                      Last »
                    </ActionButton>
                  </div>

                  <div className="page-size-control">
                    <label>Page size</label>
                    <Select value={(metrics.page_size || pageSize).toString()} onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }} options={[{ value: '10', label: '10' }, { value: '20', label: '20' }, { value: '50', label: '50' }, { value: '100', label: '100' }]} />
                  </div>
                </div>
            </CardContent>
          </Card>
        )}

        {metrics && metrics.metrics.length === 0 && !loading && (
          <Alert
            type="info"
            message="No metrics found for this cluster"
          />
        )}
      </PanelContent>
    </Panel>
  );
}