import React, { useEffect, useState } from 'react';
import { ClusterService, DeploymentService } from '../services';
import type { Deployment, StartDeploymentRequest } from '../models/deployment';

const clusterSvc = new ClusterService();
const deploySvc = new DeploymentService();

export const DeploymentsPanel: React.FC = () => {
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<StartDeploymentRequest>({ cluster_id: '', version: 'v1.0', strategy: 'canary', target_percent: 10 });

  useEffect(() => { clusterSvc.listClusters().then(c => setClusters(c || [])) }, []);
  useEffect(() => { if (selectedCluster) loadDeployments(selectedCluster) }, [selectedCluster]);

  const loadDeployments = async (clusterID: string) => {
    const list = await deploySvc.listDeployments(clusterID);
    setDeployments(list || []);
  };

  const onStart = async () => {
    setCreating(true);
    try {
      const req = { ...form, cluster_id: selectedCluster };
      const d = await deploySvc.startDeployment(req);
      await loadDeployments(selectedCluster);
      alert('Started deployment: ' + d.id);
    } catch (err) { console.error(err) }
    setCreating(false);
  };

  const onRollback = async (id: string) => {
    try { await deploySvc.rollback(id); await loadDeployments(selectedCluster) } catch (err) { console.error(err) }
  };

  const onRefresh = async () => { if (selectedCluster) await loadDeployments(selectedCluster) };

  return (
    <div className="panel deployments-panel">
      <h2>Deployments / Rollouts</h2>
      <div className="row">
        <div className="col">
          <label>Cluster</label>
          <select value={selectedCluster} onChange={(e) => setSelectedCluster(e.target.value)}>
            <option value="">-- select cluster --</option>
            {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col actions">
          <button className="action-button" onClick={onRefresh} disabled={!selectedCluster}>Refresh</button>
        </div>
      </div>

      <hr />

      <div className="row">
        <div className="col">
          <h3>Start deployment</h3>
          <div className="form-grid">
            <input placeholder="Version" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} />
            <select value={form.strategy} onChange={e => setForm({ ...form, strategy: e.target.value })}>
              <option value="canary">Canary</option>
              <option value="blue-green">Blue/Green</option>
              <option value="rolling">Rolling</option>
            </select>
            <input type="number" placeholder="Target % (canary)" value={form.target_percent} onChange={e => setForm({ ...form, target_percent: Number(e.target.value) })} />
          </div>
          <div style={{marginTop: '8px'}}>
            <button className="action-button primary" onClick={onStart} disabled={!selectedCluster || creating}>Start</button>
          </div>
        </div>

        <div className="col">
          <h3>Recent rollouts</h3>
          {!selectedCluster && <div className="muted">Select a cluster to view rollouts</div>}
          {selectedCluster && (
            <div className="policies-list">
              {deployments.length === 0 && <div className="muted">No deployments yet</div>}
              {deployments.map(d => (
                <div key={d.id} className="policy">
                  <div className="meta">
                    <strong>{d.version}</strong> <span className="muted">({d.strategy})</span>
                    <div className="small muted">status: {d.status} • started: {d.started_at}</div>
                    <div className="small muted">logs: {d.logs?.slice(-3).join(' • ')}</div>
                  </div>
                  <div className="actions">
                    <button className="action-button small" onClick={() => onRollback(d.id)}>Rollback</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeploymentsPanel;
