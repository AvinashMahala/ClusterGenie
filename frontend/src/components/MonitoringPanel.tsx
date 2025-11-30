// frontend/src/components/MonitoringPanel.tsx

import { useState, useEffect } from 'react';
import { MonitoringService } from '../services/monitoringService';
import { ObservabilityService } from '../services/observabilityService';
import type { Metric, MetricsResponse } from '../models/metric';
import { Panel, PanelHeader, PanelContent, Card, CardHeader, CardContent, Select, ActionButton, Alert, LoadingSpinner, StatusBadge } from './common';
import { ClusterRepositoryImpl } from '../repositories/clusterRepository';
import type { Cluster } from '../models/cluster';
import './MonitoringPanel.scss';
import { GRAFANA_URL } from '../lib/config';

const monitoringService = new MonitoringService();
const obsService = new ObservabilityService();

export function MonitoringPanel() {
  const [clusterId, setClusterId] = useState('');
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedType, setSelectedType] = useState<Metric['type'] | ''>('');
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<any|null>(null);
  const [workerPool, setWorkerPool] = useState<any|null>(null);
  const [ruleName, setRuleName] = useState<string>('jobs_create');
  const [ruleScopeType, setRuleScopeType] = useState<string>('global');
  const [ruleScopeId, setRuleScopeId] = useState<string>('');
  const [ruleRefill, setRuleRefill] = useState<number | ''>('');
  const [ruleCapacity, setRuleCapacity] = useState<number | ''>('');
  const [ruleStatus, setRuleStatus] = useState<string | null>(null);
  const [scopeType, setScopeType] = useState<string>('global');
  const [scopeId, setScopeId] = useState<string>('');
  const [showGrafanaEmbed, setShowGrafanaEmbed] = useState<boolean>(false);

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
      // fetch observability statuses on each refresh
      try {
        const rl = await obsService.getRateLimit('diagnosis');
        setRateLimit(rl);
      } catch {
        setRateLimit(null);
      }
      try {
        const ws = await obsService.getWorkerPool();
        setWorkerPool(ws);
      } catch {
        setWorkerPool(null);
      }
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [clusterId, selectedType, page, pageSize]);

  useEffect(() => {
    // poll worker pool and rate limit status every 5 seconds
    const id = setInterval(async () => {
      try {
        const ws = await obsService.getWorkerPool();
        setWorkerPool(ws);
      } catch { }
      try {
        const rl = await obsService.getRateLimit('diagnosis');
        setRateLimit(rl);
      } catch { }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const fetchRule = async () => {
    setRuleStatus(null);
    try {
      const cfg = await obsService.getRateLimitConfig(ruleName, ruleScopeType, ruleScopeId || undefined);
      if (cfg && cfg.config) {
        setRuleRefill(parseFloat(cfg.config.refill_rate || '') || '');
        setRuleCapacity(parseFloat(cfg.config.capacity || '') || '');
        setRuleStatus('loaded');
      } else {
        setRuleRefill('');
        setRuleCapacity('');
        setRuleStatus('not found');
      }
    } catch (err) {
      setRuleStatus('error');
    }
  };

  const saveRule = async () => {
    setRuleStatus(null);
    try {
      const body: any = { name: ruleName };
      if (ruleScopeType !== 'global') {
        body.scope_type = ruleScopeType;
        body.scope_id = ruleScopeId;
      }
      if (ruleRefill !== '') body.refill_rate = ruleRefill;
      if (ruleCapacity !== '') body.capacity = ruleCapacity;
      const resp = await obsService.setRateLimitConfig(body);
      if (resp && resp.ok) setRuleStatus('saved');
      else setRuleStatus('saved');
    } catch (err) {
      setRuleStatus('error');
    }
  };

  const fetchScopedRateLimit = async () => {
    try {
      if (scopeType === 'global') {
        const rl = await obsService.getRateLimit('diagnosis');
        setRateLimit(rl);
      } else {
        const rl = await obsService.getRateLimitScoped('diagnosis', scopeType, scopeId);
        setRateLimit(rl);
      }
    } catch {
      setRateLimit(null);
    }
  }

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

        {/* Dashboard summary */}
        <div className="monitoring-hero">
          <div className="hero-left">
            <div className="hero-title">Realtime cluster health</div>
            <div className="hero-sub">Quick snapshot — latest values across monitored clusters</div>
          </div>
          <div className="hero-stats">
            {['cpu', 'memory', 'network'].map((t) => (
              <div key={t} className="stat-card">
                <div className={`stat-value ${getMetricColor(t)}`}>
                  {latestMetrics[t] ? formatValue(latestMetrics[t].value, latestMetrics[t].unit) : '—'}
                </div>
                <div className="stat-label">{t.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Metrics Summary */}
        {/* Phase 6: Observability (Rate limiter / Worker pool) */}
        <Card>
          <CardHeader title="Phase 6 Observability" />
          <CardContent>
            <div className="observability-grid">
              <div className="observability-item">
                <div className="observability-title">Rate Limit (diagnosis) {rateLimit ? <StatusBadge status={String(Math.round(rateLimit.available * 100)/100)} variant="success" size="sm" /> : <StatusBadge status="unavailable" variant="error" size="sm" />}</div>
                <div className="observability-body">
                  {rateLimit ? (
                    <>
                      <div>Available tokens: {Math.round(rateLimit.available * 100)/100}</div>
                      <div>Capacity: {rateLimit.capacity}</div>
                      <div>Rate (per sec): {rateLimit.rate_per_sec}</div>
                    </>
                  ) : (
                    <div className="text-muted">Rate limit status unavailable</div>
                  )}
                  <div className="observability-controls">
                    <Select label="Scope" value={scopeType} onChange={(e) => setScopeType(e.target.value)} options={[{ value: 'global', label: 'Global' }, { value: 'user', label: 'User' }, { value: 'cluster', label: 'Cluster' }]} />
                    {scopeType !== 'global' && (
                      <input type="text" className="scope-input" placeholder="Enter id" value={scopeId} onChange={(e) => setScopeId(e.target.value)} />
                    )}
                    <ActionButton onClick={fetchScopedRateLimit}>Fetch</ActionButton>
                  </div>
                </div>
                <div className="observability-controls grafana-controls">
                  <ActionButton variant="secondary" onClick={() => setShowGrafanaEmbed((s) => !s)}>
                    {showGrafanaEmbed ? 'Hide' : 'Embed'} Grafana Panel
                  </ActionButton>
                  <ActionButton variant="secondary" onClick={() => window.open(`${GRAFANA_URL}/d/cg-demo?orgId=1${scopeId ? `&var-cluster=${encodeURIComponent(scopeId)}` : ''}${scopeId && scopeType === 'user' ? `&var-user=${encodeURIComponent(scopeId)}` : ''}`)}>
                    Open Dashboard
                  </ActionButton>
                </div>
              </div>

              <div className="observability-item">
                <div className="observability-title">Job Worker Pool {workerPool ? <StatusBadge status={`${workerPool.active_workers} active`} variant="success" size="sm" /> : <StatusBadge status="unavailable" variant="error" size="sm" />}</div>
                <div className="observability-body">
                  {workerPool ? (
                    <>
                      <div>Workers: {workerPool.worker_count}</div>
                      <div>Active: {workerPool.active_workers}</div>
                      <div>Queue: {workerPool.queue_length}/{workerPool.queue_capacity}</div>
                      {workerPool.queued_ids && workerPool.queued_ids.length > 0 && (
                        <div className="queue-list">
                          <div className="queue-title">Queued job IDs</div>
                          <div className="queue-ids">
                            {workerPool.queued_ids.slice(0, 20).map((id: string) => (
                              <div key={id} className="queue-id badge">{id}</div>
                            ))}
                            {workerPool.queued_ids.length > 20 && (
                              <div className="queue-more">+{workerPool.queued_ids.length - 20} more</div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-500">Worker pool status unavailable</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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

        {/* Optional embedded Grafana panel */}
        {showGrafanaEmbed && (
          <Card>
            <CardHeader title="Grafana — ClusterGenie Dashboard (embed)" />
            <CardContent>
              <div style={{ height: 600 }}>
                <iframe
                  title="ClusterGenie Grafana"
                  src={`${GRAFANA_URL}/d/cg-demo?orgId=1${scopeType === 'cluster' && scopeId ? `&var-cluster=${encodeURIComponent(scopeId)}` : ''}${scopeType === 'user' && scopeId ? `&var-user=${encodeURIComponent(scopeId)}` : ''}`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manage persisted limiter rules */}
        <Card>
          <CardHeader title="Manage limiter rules (Redis)" />
          <CardContent>
            <div className="rule-grid">
              <Select label="Rule name" value={ruleName} onChange={(e) => setRuleName(e.target.value)} options={[{ value: 'jobs_create', label: 'jobs_create' }, { value: 'diagnosis', label: 'diagnosis' }]} />
              <Select label="Scope type" value={ruleScopeType} onChange={(e) => setRuleScopeType(e.target.value)} options={[{ value: 'global', label: 'Global' }, { value: 'user', label: 'User' }, { value: 'cluster', label: 'Cluster' }]} />
              {ruleScopeType !== 'global' && (
                <input className="scope-input" placeholder="Scope id (e.g. user-alice or cluster-123)" value={ruleScopeId} onChange={(e) => setRuleScopeId(e.target.value)} />
              )}

              <div className="rule-numeric">
                <label>Refill rate (tokens/sec)</label>
                <input type="number" step="0.01" value={ruleRefill === '' ? '' : String(ruleRefill)} onChange={(e) => setRuleRefill(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>

              <div className="rule-numeric">
                <label>Capacity</label>
                <input type="number" step="1" value={ruleCapacity === '' ? '' : String(ruleCapacity)} onChange={(e) => setRuleCapacity(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>

            </div>

            <div className="rule-actions">
              <ActionButton onClick={fetchRule}>Fetch</ActionButton>
              <ActionButton onClick={saveRule}>Save</ActionButton>
              {ruleStatus && <div className="rule-status">Status: {ruleStatus}</div>}
            </div>
          </CardContent>
        </Card>

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