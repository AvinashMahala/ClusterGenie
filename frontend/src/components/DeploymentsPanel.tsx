import React, { useEffect, useState } from 'react';
import { ClusterService, DeploymentService } from '../services';
import { Panel, PanelHeader, PanelContent, Card, CardHeader, CardContent, ActionButton, Select, Input, LoadingSpinner, StatusBadge, Alert } from './common';
import './DeploymentsPanel.scss';
import type { Deployment, StartDeploymentRequest } from '../models/deployment';

const clusterSvc = new ClusterService();
const deploySvc = new DeploymentService();

export const DeploymentsPanel: React.FC = () => {
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<StartDeploymentRequest>({ cluster_id: '', version: 'v1.0', strategy: 'canary', target_percent: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logModal, setLogModal] = useState<{ id: string; logs: string[] } | null>(null);

  useEffect(() => { clusterSvc.listClusters().then(c => setClusters(c || [])) }, []);
  useEffect(() => { if (selectedCluster) loadDeployments(selectedCluster) }, [selectedCluster]);

  const loadDeployments = async (clusterID: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await deploySvc.listDeployments(clusterID);
      setDeployments(list || []);
    } catch (err:any) {
      setError(err?.message || 'Failed to load deployments');
    } finally {
      setLoading(false);
    }
  };

  const onStart = async () => {
    setCreating(true);
    try {
      const req = { ...form, cluster_id: selectedCluster };
      const d = await deploySvc.startDeployment(req);
      await loadDeployments(selectedCluster);
      setTimeout(()=>{},0);
      // replaced alert -> inline status update below
    } catch (err) { console.error(err) }
    setCreating(false);
  };

  const onRollback = async (id: string) => {
    try { await deploySvc.rollback(id); await loadDeployments(selectedCluster); } catch (err) { console.error(err) }
  };

  const onViewLogs = async (id: string) => {
    try {
      const d = await deploySvc.getDeployment(id);
      setLogModal({ id: id, logs: d.logs || [] });
    } catch (err) {
      console.error(err);
      setError('Failed to fetch logs');
    }
  };

  const onRefresh = async () => { if (selectedCluster) await loadDeployments(selectedCluster) };

  return (
    <Panel>
      <PanelHeader title="Deployments / Rollouts" subtitle="Start rollouts, inspect the recent deployments and roll them back" />
      <PanelContent>
        <Card>
          <CardHeader title="Controls" />
          <CardContent>
            <div className="deploy-controls">
              <div className="field">
                <label>Cluster</label>
                <Select value={selectedCluster} onChange={(e:any) => setSelectedCluster(e.target.value)} options={[{ value: '', label: '-- select cluster --' }, ...(clusters.map(c=>({ value: c.id, label: c.name || c.id }))) ]} />
              </div>
              <div className="actions-right">
                <ActionButton onClick={onRefresh} disabled={!selectedCluster || loading}>{loading ? <LoadingSpinner size="sm" /> : 'Refresh'}</ActionButton>
              </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
          </CardContent>
        </Card>

        <div className="deploy-grid">
          <div className="deploy-left">
            <Card>
              <CardHeader title="Start a deployment" />
              <CardContent>
                <div className="form-grid">
                  <Input label="Version" placeholder="Version" value={form.version} onChange={(e:any) => setForm({ ...form, version: e.target.value })} />
                  <Select label="Strategy" value={form.strategy} onChange={(e:any) => setForm({ ...form, strategy: e.target.value })} options={[{ value: 'canary', label: 'Canary' }, { value: 'blue-green', label: 'Blue/Green' }, { value: 'rolling', label: 'Rolling' }]} />
                  <Input label="Target % (canary)" type="number" value={String(form.target_percent)} onChange={(e:any) => setForm({ ...form, target_percent: Number(e.target.value) })} />
                </div>
                <div className="start-actions">
                  <ActionButton variant="primary" onClick={onStart} disabled={!selectedCluster || creating}>{creating ? <LoadingSpinner size="sm" /> : 'Start'} </ActionButton>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="deploy-right">
            <Card>
              <CardHeader title={`Recent rollouts${selectedCluster ? ` — ${selectedCluster}` : ''}`} />
              <CardContent>
                {!selectedCluster && <div className="muted">Select a cluster to view rollouts</div>}
                {selectedCluster && (
                  <div className="deploy-list">
                    {deployments.length === 0 && <div className="muted">No deployments yet</div>}
                    {deployments.map(d => (
                      <div className="deploy-row" key={d.id}>
                        <div className="deploy-left-col">
                          <div className="deploy-version">{d.version}</div>
                          <div className="deploy-meta">{d.strategy} • <span className="small muted">started {d.started_at}</span></div>
                          <div className="deploy-status">
                            <StatusBadge status={d.status} variant={d.status === 'success' ? 'success' : d.status === 'failed' ? 'error' : 'warning'} size="sm" />
                            <span className="small muted"> &nbsp; • &nbsp; {d.logs?.length || 0} logs</span>
                          </div>
                          <div className="deploy-preview small muted">{d.logs?.slice(-3).join(' • ')}</div>
                        </div>
                        <div className="deploy-actions">
                          <ActionButton size="sm" variant="secondary" onClick={() => onViewLogs(d.id)}>View logs</ActionButton>
                          <ActionButton size="sm" variant="danger" onClick={() => onRollback(d.id)}>Rollback</ActionButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {logModal && (
          <div className="log-modal-overlay" role="dialog" aria-modal="true">
            <div className="log-modal-card">
              <div className="log-modal-header">
                <div className="title">Logs: {logModal.id}</div>
                <div className="actions"><ActionButton variant="secondary" onClick={() => setLogModal(null)}>Close</ActionButton></div>
              </div>
              <div className="log-modal-body"><pre className="log-block">{(logModal.logs || []).join('\n')}</pre></div>
            </div>
          </div>
        )}
      </PanelContent>
    </Panel>
  );
};

export default DeploymentsPanel;
