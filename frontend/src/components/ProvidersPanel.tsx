import React, { useEffect, useState } from 'react';
import { ProviderService, ClusterService } from '../services';
import { Panel, PanelHeader, PanelContent, Card, CardHeader, CardContent, ActionButton, Input, Select, Alert, LoadingSpinner } from './common';
import './ProvidersPanel.scss';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [showDetails, setShowDetails] = useState<Provider | null>(null);

  useEffect(() => { loadProviders(); clusterSvc.listClusters().then(c=>setClusters(c || [])); }, []);

  const loadProviders = async () => { setLoading(true); try { const p = await providerSvc.listProviders(); setProviders(p || []); } catch (err:any) { setError(err?.message || 'Failed to load providers'); } finally { setLoading(false); } }

  const onCreate = async () => {
    setLoading(true); setError(null);
    try {
      await providerSvc.createProvider({ name, regions: ['region-a', 'region-b'], capacity, classes: ['small','medium'] });
      await loadProviders();
      setName(''); setCapacity(10);
    } catch (err:any) {
      setError(err?.message || 'Create failed');
    } finally { setLoading(false); }
  }

  const onSchedule = async () => {
    if (!clusterID) return setError('Select cluster first');
    setLoading(true); setError(null);
    try {
      const r = await providerSvc.schedule(clusterID, preferred, avoid);
      setShowDetails({ id: '__placement_result', name: 'Placement result', capacity: 0, used: 0, classes: [], regions: [], meta: r });
    } catch (err:any) {
      setError(err?.message || 'Schedule failed');
    } finally { setLoading(false); }
  }

  const onMigrate = async () => {
    if (!dropletId || !preferred) return setError('Provide droplet id and target provider');
    setLoading(true); setError(null);
    try {
      await providerSvc.migrate(dropletId, preferred);
      setShowDetails({ id: '__migration', name: `Migration ${dropletId}`, capacity: 0, used: 0, classes: [], regions: [], meta: { dropletId, target: preferred } });
    } catch (err:any) {
      setError(err?.message || 'Migration failed');
    } finally { setLoading(false); }
  }

  return (
    <Panel>
      <PanelHeader title="Multi-cloud Simulation" subtitle="Manage providers, capacity and simulate scheduling/migrations" />
      <PanelContent>
        <Card>
          <CardHeader title="Providers" subtitle={`Total ${providers.length}`} />
          <CardContent>
            <div className="providers-top">
              <div className="create-form">
                <Input label="Provider name" placeholder="Provider name" value={name} onChange={(e:any) => setName(e.target.value)} />
                <Input label="Capacity" type="number" placeholder="Capacity" value={String(capacity)} onChange={(e:any) => setCapacity(Number(e.target.value))} />
                <div className="create-actions">
                  <ActionButton onClick={onCreate} disabled={loading}>{loading ? <LoadingSpinner size="sm" /> : 'Create provider'}</ActionButton>
                </div>
              </div>

              <div className="providers-list">
                {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

                {loading && !providers.length ? (
                  <div className="loading-list">Loading providers…</div>
                ) : (
                  <table className="providers-table">
                    <thead>
                      <tr><th>Name</th><th>Capacity</th><th>Used</th><th>Regions</th><th>Classes</th><th></th></tr>
                    </thead>
                    <tbody>
                      {providers.map(p => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td>{p.capacity}</td>
                          <td>{p.used || 0}</td>
                          <td>{(p.regions || []).join(', ')}</td>
                          <td>{(p.classes || []).join(', ')}</td>
                          <td className="actions-col"><ActionButton size="sm" variant="secondary" onClick={() => setShowDetails(p)}>Details</ActionButton></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Simulate" />
          <CardContent>
            <div className="simulate-grid">
              <div className="simulate-left">
                <Select label="Cluster" options={[{ value: '', label: '-- select cluster --' }, ...(clusters.map(c=>({ value: c.id, label: c.name || c.id }))) ]} value={clusterID} onChange={(e:any) => setClusterID(e.target.value)} />
                <Input label="Preferred provider" placeholder="Preferred provider" value={preferred} onChange={(e:any) => setPreferred(e.target.value)} />
                <Input label="Avoid provider" placeholder="Avoid provider" value={avoid} onChange={(e:any) => setAvoid(e.target.value)} />
                <div className="simulate-actions">
                  <ActionButton onClick={onSchedule} disabled={loading}>{loading ? <LoadingSpinner size="sm" /> : 'Simulate placement'}</ActionButton>
                  <ActionButton variant="secondary" onClick={() => { setPreferred(''); setAvoid(''); }}>Clear</ActionButton>
                </div>
              </div>

              <div className="simulate-right">
                <div className="migrate-box">
                  <div className="small muted">Migrate a droplet (enter droplet id)</div>
                  <Input label="Droplet ID" placeholder="droplet-id" value={dropletId} onChange={(e:any) => setDropletId(e.target.value)} />
                  <Input label="Target provider" placeholder="target provider" value={preferred} onChange={(e:any) => setPreferred(e.target.value)} />
                  <div className="migrate-actions"><ActionButton variant="danger" onClick={onMigrate}>Start migrate</ActionButton></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* details modal */}
        {showDetails && (
          <div className="details-overlay" role="dialog" aria-modal="true">
            <div className="details-card">
              <div className="details-header">
                <div className="details-title">{showDetails.name}</div>
                <div className="details-close"><ActionButton variant="secondary" onClick={() => setShowDetails(null)}>Close</ActionButton></div>
              </div>
              <div className="details-body">
                <div><strong>Capacity:</strong> {showDetails.capacity}</div>
                <div><strong>Used:</strong> {showDetails.used || 0}</div>
                <div><strong>Regions:</strong> {(showDetails.regions || []).join(', ')}</div>
                <div><strong>Classes:</strong> {(showDetails.classes || []).join(', ')}</div>
                {showDetails.meta && <pre className="meta-block">{JSON.stringify(showDetails.meta, null, 2)}</pre>}
              </div>
            </div>
          </div>
        )}
      </PanelContent>
    </Panel>
  )
}

export default ProvidersPanel;
