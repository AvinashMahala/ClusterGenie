import React, { useEffect, useState } from 'react';
import { ClusterService, BillingService } from '../services';
import { Panel, PanelHeader, PanelContent, Card, CardHeader, CardContent, ActionButton, LoadingSpinner } from './common';
import './BillingPanel.scss';

const clusterSvc = new ClusterService();
const billingSvc = new BillingService();

export const BillingPanel: React.FC = () => {
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedCluster, setSelectedCluster] = useState('');
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { clusterSvc.listClusters().then(c => setClusters(c || [])) }, []);

  const onEstimate = async () => {
    if (!selectedCluster) return setError('Please choose a cluster');
    setLoading(true);
    setError(null);
    try {
      const r = await billingSvc.estimateCluster(selectedCluster);
      setEstimate(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to estimate');
    } finally {
      setLoading(false);
    }
  }

  const onReset = () => { setSelectedCluster(''); setEstimate(null); setError(null); }

  return (
    <Panel>
      <PanelHeader title="Billing & Cost Estimates" subtitle="Estimate costs for clusters and review historical breakdowns" />
      <PanelContent>
        <Card>
          <CardHeader title="Estimate for a cluster" />
          <CardContent>
            <div className="billing-row">
              <div className="billing-field">
                <label>Cluster</label>
                <select value={selectedCluster} onChange={(e) => setSelectedCluster(e.target.value)}>
                  <option value="">-- select cluster --</option>
                  {clusters.map(c=> <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
                </select>
              </div>
              <div className="billing-actions">
                <ActionButton onClick={onEstimate} disabled={loading}>{loading ? <LoadingSpinner size="sm" /> : 'Estimate'}</ActionButton>
                <ActionButton variant="secondary" onClick={onReset}>Reset</ActionButton>
              </div>
            </div>

            {error && <div className="billing-error">{error}</div>}

            {estimate ? (
              <div className="estimate-summary">
                <div className="summary-left">
                  <div className="summary-item">
                    <div className="label">Droplet count</div>
                    <div className="value">{estimate.droplet_count}</div>
                  </div>
                  <div className="summary-item">
                    <div className="label">Hourly</div>
                    <div className="value">${Number(estimate.hourly_cost).toFixed(2)}</div>
                  </div>
                  <div className="summary-item">
                    <div className="label">Estimated monthly</div>
                    <div className="value">${Number(estimate.monthly_cost).toFixed(2)}</div>
                  </div>
                </div>
                <div className="summary-right">
                  {estimate.breakdown && Array.isArray(estimate.breakdown) && (
                    <table className="breakdown-table">
                      <thead>
                        <tr><th>Type</th><th>Count</th><th>Hourly</th><th>Monthly</th></tr>
                      </thead>
                      <tbody>
                        {estimate.breakdown.map((row: any) => (
                          <tr key={`${row.type}-${row.count}`}>
                            <td>{row.type}</td>
                            <td>{row.count}</td>
                            <td>${Number(row.hourly).toFixed(2)}</td>
                            <td>${Number(row.monthly).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              <div className="estimate-empty">Choose a cluster and click Estimate to review cost details.</div>
            )}
          </CardContent>
        </Card>
      </PanelContent>
    </Panel>
  )
}

export default BillingPanel;
