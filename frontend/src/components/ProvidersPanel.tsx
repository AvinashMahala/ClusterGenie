import React, { useEffect, useState } from 'react';
import { ProviderService, ClusterService } from '../services';
import type { Provider } from '../models/provider';

const providerSvc = new ProviderService();
const clusterSvc = new ClusterService();

export const ProvidersPanel: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [clusterID, setClusterID] = useState('');
  const [name, setName] = useState('demo-cloud');
  const [capacity, setCapacity] = useState(10);
  const [preferred, setPreferred] = useState('');
  const [avoid, setAvoid] = useState('');
  const [dropletId, setDropletId] = useState('');

  useEffect(() => { loadProviders(); clusterSvc.listClusters().then(c=>setClusters(c || [])); }, []);

  const loadProviders = async () => { const p = await providerSvc.listProviders(); setProviders(p || []); }

  const onCreate = async () => {
    await providerSvc.createProvider({ name, regions: ['region-a', 'region-b'], capacity, classes: ['small','medium'] });
    await loadProviders();
  }

  const onSchedule = async () => {
    if (!clusterID) return alert('select cluster');
    const r = await providerSvc.schedule(clusterID, preferred, avoid);
    alert('Placement result:\n' + JSON.stringify(r, null, 2));
  }

  const onMigrate = async () => {
    if (!dropletId || !preferred) return alert('provide droplet id and target provider');
    await providerSvc.migrate(dropletId, preferred);
    alert('Migration started for ' + dropletId);
  }

  return (
    <div className="panel providers-panel">
      <h2>Multi-cloud Simulation</h2>
      <div className="row">
        <div className="col">
          <h3>Providers</h3>
          <div className="muted">Add providers and capacity for demo scheduling</div>
          <div style={{marginTop:8}}>
            <input placeholder="Provider name" value={name} onChange={e=>setName(e.target.value)} />
            <input type="number" placeholder="Capacity" value={capacity} onChange={e=>setCapacity(Number(e.target.value))} />
            <button className="action-button" onClick={onCreate}>Create provider</button>
          </div>
          <div style={{marginTop:12}}>
            {providers.map(p => (
              <div key={p.id} className="policy">
                <div className="meta"><strong>{p.name}</strong> <span className="muted">capacity {p.capacity} used {p.used || 0}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="col">
          <h3>Schedule / Migrate</h3>
          <div style={{marginTop:8}}>
            <label>Cluster</label>
            <select value={clusterID} onChange={e=>setClusterID(e.target.value)}>
              <option value="">-- select cluster --</option>
              {clusters.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div style={{marginTop:8}}>
              <input placeholder="Preferred provider" value={preferred} onChange={e=>setPreferred(e.target.value)} />
              <input placeholder="Avoid provider" value={avoid} onChange={e=>setAvoid(e.target.value)} />
              <button className="action-button" onClick={onSchedule}>Simulate placement</button>
            </div>

            <hr />

            <div className="small muted">Migrate a droplet (enter droplet id)</div>
            <input placeholder="droplet-id" value={dropletId} onChange={e=>setDropletId(e.target.value)} />
            <input placeholder="target provider" value={preferred} onChange={e=>setPreferred(e.target.value)} />
            <button className="action-button secondary" onClick={onMigrate}>Migrate</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProvidersPanel;
