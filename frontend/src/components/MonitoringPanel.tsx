// frontend/src/components/MonitoringPanel.tsx

import { useState, useEffect } from 'react';
import { MonitoringService } from '../services/monitoringService';
import type { Metric, MetricsResponse } from '../models/metric';
import { Panel, PanelHeader, PanelContent, Card, CardHeader, CardContent, Input, Select, ActionButton, Alert, LoadingSpinner } from './common';
import './MonitoringPanel.scss';

const monitoringService = new MonitoringService();

export function MonitoringPanel() {
  const [clusterId, setClusterId] = useState('cluster-demo');
  const [selectedType, setSelectedType] = useState<Metric['type'] | ''>('');
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    if (!clusterId.trim()) {
      setError('Please enter a cluster ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await monitoringService.getMetrics(clusterId.trim(), selectedType || undefined);
      setMetrics(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [clusterId, selectedType]);

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
          <Input
            label="Cluster ID"
            value={clusterId}
            onChange={(e) => setClusterId(e.target.value)}
            placeholder="Enter cluster ID"
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
                      <th>Type</th>
                      <th>Value</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.metrics.slice(-20).map((metric) => (
                      <tr key={`${metric.id}-${metric.timestamp.getTime()}`}>
                        <td>{metric.type}</td>
                        <td>{formatValue(metric.value, metric.unit)}</td>
                        <td>{metric.timestamp.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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