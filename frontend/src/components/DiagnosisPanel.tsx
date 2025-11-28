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

  return (
    <div className="diagnosis-panel">
      {/* Compact Header */}
      <div className="compact-header">
        <h1>Cluster Diagnosis</h1>
        <p>AI-powered cluster analysis and recommendations</p>
      </div>

      <div className="panel-content">
        {/* Diagnosis Form */}
        <div className="form-section compact">
          <div className="form-group">
            <label htmlFor="clusterId">Cluster ID</label>
            <input
              type="text"
              id="clusterId"
              value={clusterId}
              onChange={(e) => setClusterId(e.target.value)}
              placeholder="Enter cluster ID (e.g., cluster-prod)"
              className="form-input"
            />
          </div>
          <button
            onClick={handleDiagnose}
            disabled={loading}
            className="btn-primary compact"
          >
            {loading ? 'Diagnosing...' : 'Diagnose Cluster'}
          </button>

          {error && (
            <div className="error-message compact">
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Diagnosis Results */}
        {diagnosis && (
          <div className="results-section">
            {/* Cluster Info */}
            <div className="info-card compact">
              <h2>Cluster Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Name:</span>
                  <span className="value">{diagnosis.cluster.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Region:</span>
                  <span className="value">{diagnosis.cluster.region}</span>
                </div>
                <div className="info-item">
                  <span className="label">Status:</span>
                  <span className={`status-badge ${diagnosis.cluster.status}`}>
                    {diagnosis.cluster.status}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Droplets:</span>
                  <span className="value">{diagnosis.cluster.droplets.length}</span>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="insights-card compact">
              <h2>AI Insights</h2>
              <ul className="insights-list">
                {diagnosis.insights.map((insight, index) => (
                  <li key={index} className="insight-item">
                    <span className="bullet">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="recommendations-card compact">
              <h2>Recommendations</h2>
              <ul className="recommendations-list">
                {diagnosis.recommendations.map((recommendation, index) => (
                  <li key={index} className="recommendation-item">
                    <span className="bullet">→</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};