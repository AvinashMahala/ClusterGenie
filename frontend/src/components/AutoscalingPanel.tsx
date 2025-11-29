import React, { useEffect, useState } from 'react';
import { ClusterService, AutoscalingService } from '../services';
import type { AutoscalePolicy, CreateAutoscalePolicyRequest } from '../models/autoscale';

const clusterSvc = new ClusterService();
const autosvc = new AutoscalingService();

export const AutoscalingPanel: React.FC = () => {
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [policies, setPolicies] = useState<AutoscalePolicy[]>([]);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState<CreateAutoscalePolicyRequest>({
    name: '',
    cluster_id: '',
    type: 'metrics',
    enabled: true,
    min_replicas: 1,
    max_replicas: 3,
    metric_type: 'cpu',
    metric_trigger: 0.8,
  });

  useEffect(() => {
    clusterSvc.listClusters().then((c) => setClusters(c || []));
  }, []);

  useEffect(() => {
    if (selectedCluster) loadPolicies(selectedCluster);
  }, [selectedCluster]);

  const loadPolicies = async (clusterID: string) => {
    const list = await autosvc.listPolicies(clusterID);
    setPolicies(list || []);
  };

  const onCreate = async () => {
    setCreating(true);
    try {
      const req = { ...form, cluster_id: selectedCluster } as CreateAutoscalePolicyRequest;
      await autosvc.createPolicy(req);
      await loadPolicies(selectedCluster);
      setForm({ ...form, name: '' });
    } catch (err) {
      console.error(err);
    }
    setCreating(false);
  };

  const onDelete = async (id: string) => {
    try {
      await autosvc.deletePolicy(id);
      await loadPolicies(selectedCluster);
    } catch (err) {
      console.error(err);
    }
  };

  const onEvaluate = async () => {
    try {
      const r = await autosvc.evaluate(selectedCluster);
      alert('Evaluate result:\n' + JSON.stringify(r, null, 2));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="panel autoscaling-panel">
      <h2>Autoscaling / Policies</h2>
      <div className="row">
        <div className="col">
          <label>Cluster</label>
          <select value={selectedCluster} onChange={(e) => setSelectedCluster(e.target.value)}>
            <option value="">-- select cluster --</option>
            {clusters.map((c) => (
              <option value={c.id} key={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="col actions">
          <button className="action-button" onClick={onEvaluate} disabled={!selectedCluster}>Evaluate</button>
          <button className="action-button secondary" onClick={() => loadPolicies(selectedCluster)} disabled={!selectedCluster}>Refresh</button>
        </div>
      </div>

      <hr />

      <div className="row">
        <div className="col">
          <h3>Create policy</h3>
          <div className="form-grid">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="metrics">Metrics</option>
              <option value="time_of_day">Time of day</option>
              <option value="cost">Cost constraint</option>
            </select>
            <input type="number" placeholder="Min replicas" value={form.min_replicas} onChange={(e) => setForm({ ...form, min_replicas: Number(e.target.value) })} />
            <input type="number" placeholder="Max replicas" value={form.max_replicas} onChange={(e) => setForm({ ...form, max_replicas: Number(e.target.value) })} />
            {form.type === 'metrics' && (
              <>
                <select value={form.metric_type} onChange={(e) => setForm({ ...form, metric_type: e.target.value })}>
                  <option value="cpu">CPU</option>
                  <option value="memory">Memory</option>
                  <option value="network">Network</option>
                </select>
                <input step="0.01" type="number" placeholder="Trigger (0-1)" value={form.metric_trigger} onChange={(e) => setForm({ ...form, metric_trigger: Number(e.target.value) })} />
              </>
            )}
          </div>
          <div style={{marginTop: '8px'}}>
            <button disabled={!selectedCluster || creating} className="action-button primary" onClick={onCreate}>Create</button>
          </div>
        </div>

        <div className="col">
          <h3>Policies</h3>
          {!selectedCluster && <div className="muted">Select a cluster to view policies</div>}
          {selectedCluster && (
            <div className="policies-list">
              {policies.length === 0 && <div className="muted">No policies yet</div>}
              {policies.map((p) => (
                <div className="policy" key={p.id}>
                  <div className="meta">
                    <strong>{p.name}</strong> <span className="muted">({p.type})</span>
                    <div className="small muted">min:{p.min_replicas} max:{p.max_replicas} {p.metric_type ? `• ${p.metric_type} trig=${p.metric_trigger}` : ''}</div>
                  </div>
                  <div className="actions">
                    <button className="action-button small" onClick={() => onDelete(p.id)}>Delete</button>
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

export default AutoscalingPanel;
