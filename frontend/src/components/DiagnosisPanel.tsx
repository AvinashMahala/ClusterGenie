// frontend/src/components/DiagnosisPanel.tsx

import { useState } from 'react';
import { DiagnosisService } from '../services/diagnosisService';
import type { DiagnosisResponse } from '../models/cluster';
import { Panel, PanelHeader, PanelContent, FormSection, FormField, ActionButton, ErrorMessage } from './common';
import '../styles/DiagnosisPanel.scss';

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
    <Panel>
      <PanelHeader
        title="Cluster Diagnosis"
        subtitle="AI-powered cluster analysis and recommendations"
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        }
      />

      <PanelContent>
        <FormSection
          actions={
            <ActionButton
              onClick={handleDiagnose}
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Diagnosing...' : 'Diagnose Cluster'}
            </ActionButton>
          }
        >
          <FormField label="Cluster ID" required>
            <input
              type="text"
              value={clusterId}
              onChange={(e) => setClusterId(e.target.value)}
              placeholder="Enter cluster ID (e.g., cluster-prod)"
            />
          </FormField>

          {error && <ErrorMessage message={error} />}
        </FormSection>

        {diagnosis && (
          <div className="results-section">
            <div className="info-card">
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

            <div className="insights-card">
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

            <div className="recommendations-card">
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
      </PanelContent>
    </Panel>
  );
};