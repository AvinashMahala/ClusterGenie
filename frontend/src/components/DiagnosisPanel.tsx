// frontend/src/components/DiagnosisPanel.tsx

import { useState, useEffect } from 'react';
import { DiagnosisService } from '../services/diagnosisService';
import { MonitoringService } from '../services/monitoringService';
import { JobService } from '../services/jobService';
import { ClusterService } from '../services/clusterService';
import type { DiagnosisResponse, Metric } from '../models';
import { Panel, PanelHeader, PanelContent, FormSection, FormField, ActionButton, ErrorMessage, StatusBadge, Card } from './common';
import '../styles/DiagnosisPanel.scss';

const diagnosisService = new DiagnosisService();
const monitoringService = new MonitoringService();
const jobService = new JobService();
const clusterService = new ClusterService();

interface DiagnosisHistory {
  id: string;
  clusterId: string;
  timestamp: Date;
  diagnosis: DiagnosisResponse;
  metrics?: Metric[];
}

interface DiagnosisPanelProps {
  clusterId?: string;
}

export function DiagnosisPanel({ clusterId: propClusterId }: DiagnosisPanelProps = {}) {
  const [clusterId, setClusterId] = useState(propClusterId || 'test-cluster-1');
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<DiagnosisHistory[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'analytics'>('current');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<number>>(new Set());
  const [implementedRecommendations, setImplementedRecommendations] = useState<Set<number>>(new Set());

  // Load diagnosis history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('diagnosisHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load diagnosis history:', e);
      }
    }
  }, []);

  // load clusters for dropdown
  useEffect(() => {
    (async () => {
      try {
        const list = await clusterService.listClusters();
        setClusters(list || []);
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    let interval: number;
    if (autoRefresh && diagnosis) {
      interval = window.setInterval(async () => {
        await performDiagnosis(false);
      }, 30000); // Refresh every 30 seconds
    }
    return () => window.clearInterval(interval);
  }, [autoRefresh, clusterId]);

  const performDiagnosis = async (showLoading = true) => {
    if (!clusterId.trim()) {
      setError('Please enter a cluster ID');
      return;
    }

    if (showLoading) setLoading(true);
    setAnalyzing(true);
    setError(null);

    try {
      // Perform diagnosis and get metrics in parallel
      const [diagnosisResult, metricsResult] = await Promise.all([
        diagnosisService.diagnoseCluster({ cluster_id: clusterId.trim() }),
        monitoringService.getMetrics(clusterId.trim())
      ]);

      setDiagnosis(diagnosisResult);
      setMetrics(metricsResult?.metrics || []);

      // Reset recommendation actions for new diagnosis
      setDismissedRecommendations(new Set());
      setImplementedRecommendations(new Set());

      // Save to history
      const historyItem: DiagnosisHistory = {
        id: Date.now().toString(),
        clusterId: clusterId.trim(),
        timestamp: new Date(),
        diagnosis: diagnosisResult,
        metrics: metricsResult?.metrics
      };

      const newHistory = [historyItem, ...history.slice(0, 9)]; // Keep last 10
      setHistory(newHistory);
      localStorage.setItem('diagnosisHistory', JSON.stringify(newHistory));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to diagnose cluster');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const loadFromHistory = (historyItem: DiagnosisHistory) => {
    setClusterId(historyItem.clusterId);
    setDiagnosis(historyItem.diagnosis);
    setMetrics(historyItem.metrics || []);
    setActiveTab('current');
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('diagnosisHistory');
  };

  const handleDismissRecommendation = (index: number) => {
    setDismissedRecommendations(prev => new Set([...prev, index]));
    // You could also send this to the backend to track dismissed recommendations
    console.log(`Recommendation ${index} dismissed`);
  };

  const handleImplementRecommendation = async (index: number) => {
    if (!diagnosis?.cluster?.id) return;

    try {
      const recommendation = diagnosis.recommendations?.[index];
      if (!recommendation) return;

      // Determine job type based on recommendation content
      let jobType: 'provision' | 'diagnose' | 'scale' | 'monitor' = 'provision';
      if (recommendation.toLowerCase().includes('scale') || recommendation.toLowerCase().includes('droplet')) {
        jobType = 'scale';
      } else if (recommendation.toLowerCase().includes('monitor')) {
        jobType = 'monitor';
      }

      // Create a job for this recommendation
      await jobService.createJob({
        type: jobType,
        parameters: {
          cluster_id: diagnosis.cluster.id,
          description: `Implementing recommendation: ${recommendation}`
        }
      });

      // Mark as implemented
      setImplementedRecommendations(prev => new Set([...prev, index]));
      
      console.log(`Job created for recommendation: ${recommendation}`);
      
      // You could show a success toast here
      alert(`✅ Job created to implement: ${recommendation}`);
      
    } catch (error) {
      console.error('Failed to create implementation job:', error);
      alert('❌ Failed to create implementation job. Please try again.');
    }
  };

  const resetRecommendationActions = () => {
    setDismissedRecommendations(new Set());
    setImplementedRecommendations(new Set());
  };

  const getHealthScore = () => {
    if (!diagnosis?.cluster) return 0;
    const status = diagnosis.cluster.status;
    const dropletCount = diagnosis.cluster.droplets?.length || 0;

    let score = 50; // Base score
    if (status === 'healthy') score += 30;
    else if (status === 'warning') score += 15;
    else if (status === 'critical') score -= 20;

    if (dropletCount >= 3) score += 20;
    else if (dropletCount === 0) score -= 30;

    return Math.max(0, Math.min(100, score));
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="diagnosis-panel">
      <Panel>
        <PanelHeader
          title="AI Cluster Diagnosis"
          subtitle="Intelligent cluster analysis with real-time insights and recommendations"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
          actions={
            <div className="header-actions">
              <label className="auto-refresh-toggle">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-refresh
              </label>
              <ActionButton
                onClick={() => performDiagnosis()}
                disabled={loading}
                loading={loading}
                variant="primary"
              >
                {loading ? 'Analyzing...' : 'Diagnose Cluster'}
              </ActionButton>
            </div>
          }
        />

        <PanelContent>
          {/* Tab Navigation */}
          <div className="diagnosis-tabs">
            <button
              className={`tab-button ${activeTab === 'current' ? 'active' : ''}`}
              onClick={() => setActiveTab('current')}
            >
              Current Analysis
            </button>
            <button
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History ({history.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
          </div>

          {activeTab === 'current' && (
            <>
              {/* Input Section */}
              <Card className="input-card">
                <FormSection>
                  <div className="input-grid">
                    <FormField label="Cluster" required>
                      <div className="cluster-selector-row">
                        <select
                          value={clusterId}
                          onChange={(e) => setClusterId(e.target.value)}
                          className="cluster-dropdown"
                        >
                          <option value="">-- Select cluster (or type id) --</option>
                          {clusters.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name || c.id}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={clusterId}
                          onChange={(e) => setClusterId(e.target.value)}
                          placeholder="Or type cluster ID (e.g., cluster-prod)"
                          onKeyPress={(e) => e.key === 'Enter' && performDiagnosis()}
                        />
                      </div>
                    </FormField>
                    <div className="quick-actions">
                      <button
                        className="quick-cluster-btn"
                        onClick={() => setClusterId('cluster-demo')}
                      >
                        Demo Cluster
                      </button>
                      <button
                        className="quick-cluster-btn"
                        onClick={() => setClusterId('test-cluster-1')}
                      >
                        Test Cluster
                      </button>
                    </div>
                  </div>
                  {error && <ErrorMessage message={error} />}
                </FormSection>
              </Card>

              {/* Results Section */}
              {diagnosis && (
                <div className="results-section">
                  {/* Health Score Overview */}
                  <Card className="health-score-card">
                    <div className="health-score-header">
                      <h3>Cluster Health Score</h3>
                      <div className="score-display">
                        <div className="score-circle" style={{ backgroundColor: getHealthColor(getHealthScore()) }}>
                          <span className="score-number">{getHealthScore()}</span>
                        </div>
                        <div className="score-label">
                          <span className="score-text">{getHealthScore() >= 80 ? 'Excellent' : getHealthScore() >= 60 ? 'Good' : 'Needs Attention'}</span>
                          <span className="score-subtitle">Based on status, resources & metrics</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Cluster Overview */}
                  <div className="overview-grid">
                    <Card className="cluster-info-card">
                      <h3>Cluster Overview</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="label">Name:</span>
                          <span className="value">{diagnosis.cluster?.name || 'Unknown'}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Region:</span>
                          <span className="value">{diagnosis.cluster?.region || 'Unknown'}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Status:</span>
                          <StatusBadge status={diagnosis.cluster?.status || 'unknown'} />
                        </div>
                        <div className="info-item">
                          <span className="label">Droplets:</span>
                          <span className="value">{diagnosis.cluster?.droplets?.length || 0}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Last Checked:</span>
                          <span className="value">
                            {diagnosis.cluster?.lastChecked ?
                              new Date(diagnosis.cluster.lastChecked).toLocaleString() :
                              'Never'
                            }
                          </span>
                        </div>
                        <div className="info-item cluster-actions">
                          <span className="label">Actions:</span>
                          <div className="value actions-list">
                            <button
                              className="action-mini"
                              onClick={() => performDiagnosis()}
                            >Diagnose</button>
                            <button
                              className="action-mini"
                              onClick={async () => {
                                if (!diagnosis?.cluster?.id) return alert('Run a diagnosis first or pick a cluster');
                                try {
                                  await jobService.createJob({
                                    type: 'provision',
                                    parameters: { cluster_id: diagnosis.cluster.id, description: 'Provisioning job from diagnosis' }
                                  });
                                  alert('✅ Provisioning job created');
                                } catch (err) {
                                  console.error(err);
                                  alert('Failed to create provisioning job');
                                }
                              }}
                            >Create Provision Job</button>
                            <button
                              className="action-mini"
                              onClick={async () => {
                                if (!diagnosis?.cluster?.id) return alert('Run a diagnosis first or pick a cluster');
                                try {
                                  await jobService.createJob({
                                    type: 'scale',
                                    parameters: { cluster_id: diagnosis.cluster.id, description: 'Scaling job from diagnosis' }
                                  });
                                  alert('✅ Scaling job created');
                                } catch (err) {
                                  console.error(err);
                                  alert('Failed to create scaling job');
                                }
                              }}
                            >Create Scale Job</button>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Real-time Metrics */}
                    {metrics.length > 0 && (
                      <Card className="metrics-card">
                        <h3>Live Metrics</h3>
                        <div className="metrics-grid">
                          {metrics.slice(0, 6).map((metric, index) => (
                            <div key={index} className="metric-item">
                              <div className="metric-name">{metric.type.toUpperCase()}</div>
                              <div className="metric-value">{metric.value.toFixed(1)} {metric.unit}</div>
                              <div className="metric-time">
                                {new Date(metric.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* AI Insights */}
                  <Card className="insights-card">
                    <div className="card-header">
                      <h3>AI-Powered Insights</h3>
                      {analyzing && <div className="analyzing-indicator">Analyzing...</div>}
                    </div>
                    <div className="insights-content">
                      {(diagnosis.insights || []).map((insight, index) => (
                        <div key={index} className="insight-item">
                          <div className="insight-icon">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="insight-text">{insight}</div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Actionable Recommendations */}
                  <Card className="recommendations-card">
                    <div className="card-header">
                      <h3>Recommended Actions</h3>
                      {(dismissedRecommendations.size > 0 || implementedRecommendations.size > 0) && (
                        <button 
                          className="reset-actions-btn"
                          onClick={resetRecommendationActions}
                          title="Reset all recommendation actions"
                        >
                          Reset Actions
                        </button>
                      )}
                    </div>
                    <div className="recommendations-content">
                      {(diagnosis.recommendations || [])
                        .map((recommendation, index) => ({ recommendation, index }))
                        .filter(({ index }) => !dismissedRecommendations.has(index))
                        .map(({ recommendation, index }) => (
                        <div key={index} className={`recommendation-item ${implementedRecommendations.has(index) ? 'implemented' : ''}`}>
                          <div className="recommendation-priority">
                            {index < 2 ? 'High' : 'Medium'}
                          </div>
                          <div className="recommendation-text">
                            {recommendation}
                            {implementedRecommendations.has(index) && (
                              <span className="implementation-status">✓ Marked for implementation</span>
                            )}
                          </div>
                          <div className="recommendation-actions">
                            {!implementedRecommendations.has(index) && (
                              <button 
                                className="action-btn implement"
                                onClick={() => handleImplementRecommendation(index)}
                              >
                                Implement
                              </button>
                            )}
                            <button 
                              className="action-btn dismiss"
                              onClick={() => handleDismissRecommendation(index)}
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))}
                      {diagnosis.recommendations && diagnosis.recommendations.length > 0 && dismissedRecommendations.size === diagnosis.recommendations.length && (
                        <div className="all-dismissed-message">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <p>All recommendations have been dismissed</p>
                          <button 
                            className="restore-recommendations-btn"
                            onClick={resetRecommendationActions}
                          >
                            Restore All
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <Card className="history-card">
              <div className="history-header">
                <h3>Diagnosis History</h3>
                <button className="clear-history-btn" onClick={clearHistory}>
                  Clear History
                </button>
              </div>
              <div className="history-list">
                {history.length === 0 ? (
                  <div className="empty-history">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No diagnosis history yet</p>
                    <p>Run your first diagnosis to get started</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="history-item" onClick={() => loadFromHistory(item)}>
                      <div className="history-info">
                        <div className="history-cluster">{item.clusterId}</div>
                        <div className="history-time">{item.timestamp.toLocaleString()}</div>
                      </div>
                      <div className="history-status">
                        <StatusBadge status={item.diagnosis.cluster?.status || 'unknown'} />
                      </div>
                      <div className="history-insights">
                        {item.diagnosis.insights?.length || 0} insights
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {activeTab === 'analytics' && (
            <Card className="analytics-card">
              <h3>Cluster Analytics</h3>
              <div className="analytics-content">
                <div className="analytics-placeholder">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h4>Advanced Analytics Coming Soon</h4>
                  <p>Future features will include trend analysis, predictive insights, and performance forecasting</p>
                </div>
              </div>
            </Card>
          )}
        </PanelContent>
      </Panel>
    </div>
  );
};