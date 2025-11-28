// frontend/src/components/DiagnosisPanel.tsx

import { useState } from 'react';
import { DiagnosisService } from '../services/diagnosisService';
import type { DiagnosisResponse } from '../models/cluster';

const diagnosisService = new DiagnosisService();

export function DiagnosisPanel() {
  const [clusterId, setClusterId] = useState('');
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnose = async () => {
    if (!clusterId.trim()) {
      setError('Please enter a cluster ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await diagnosisService.diagnoseCluster({ clusterId: clusterId.trim() });
      setDiagnosis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to diagnose cluster');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="diagnosis-panel">
      <div className="panel-container">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Cluster Diagnosis</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="clusterId" className="block text-sm font-medium text-gray-700 mb-2">
              Cluster ID
            </label>
            <input
              type="text"
              id="clusterId"
              value={clusterId}
              onChange={(e) => setClusterId(e.target.value)}
              placeholder="Enter cluster ID (e.g., cluster-prod)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleDiagnose}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Diagnosing...' : 'Diagnose Cluster'}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {diagnosis && (
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Cluster Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <p className="text-sm text-gray-900">{diagnosis.cluster.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Region:</span>
                    <p className="text-sm text-gray-900">{diagnosis.cluster.region}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(diagnosis.cluster.status)}`}>
                      {diagnosis.cluster.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Droplets:</span>
                    <p className="text-sm text-gray-900">{diagnosis.cluster.droplets.length}</p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Insights</h3>
                <ul className="space-y-2">
                  {diagnosis.insights.map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                      <span className="text-sm text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {diagnosis.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></span>
                      <span className="text-sm text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
      );
}