// frontend/src/components/MonitoringPanel.tsx

import { useState, useEffect } from 'react';
import { MonitoringService } from '../services/monitoringService';
import type { Metric, MetricsResponse } from '../models/metric';

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
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Cluster Monitoring</h2>

      <div className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="clusterId" className="block text-sm font-medium text-gray-700 mb-2">
              Cluster ID
            </label>
            <input
              type="text"
              id="clusterId"
              value={clusterId}
              onChange={(e) => setClusterId(e.target.value)}
              placeholder="Enter cluster ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="metricType" className="block text-sm font-medium text-gray-700 mb-2">
              Metric Type
            </label>
            <select
              id="metricType"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as Metric['type'] | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="cpu">CPU</option>
              <option value="memory">Memory</option>
              <option value="disk">Disk</option>
              <option value="network">Network</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadMetrics}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Current Metrics Summary */}
        {Object.keys(latestMetrics).length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(latestMetrics).map(([type, metric]) => (
                <div key={type} className="text-center">
                  <div className={`text-2xl font-bold ${getMetricColor(type)}`}>
                    {formatValue(metric.value, metric.unit)}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">{type}</div>
                  <div className="text-xs text-gray-400">
                    {metric.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metrics History */}
        {metrics && metrics.metrics.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Metrics History ({metrics.period})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.metrics.slice(-20).map((metric) => (
                    <tr key={`${metric.id}-${metric.timestamp.getTime()}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                        {metric.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatValue(metric.value, metric.unit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {metric.timestamp.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {metrics && metrics.metrics.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No metrics found for this cluster</p>
          </div>
        )}
      </div>
    </div>
  );
}