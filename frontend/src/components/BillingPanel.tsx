import React, { useEffect, useState } from 'react';
import { ClusterService, BillingService } from '../services';

const clusterSvc = new ClusterService();
const billingSvc = new BillingService();

export const BillingPanel: React.FC = () => {
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedCluster, setSelectedCluster] = useState('');
  const [estimate, setEstimate] = useState<any>(null);

  useEffect(() => { clusterSvc.listClusters().then(c => setClusters(c || [])) }, []);

  const onEstimate = async () => {
    if (!selectedCluster) return alert('choose cluster');
    const r = await billingSvc.estimateCluster(selectedCluster);
    setEstimate(r);
  }

  return (
    <div className="panel billing-panel">
      <h2>Billing & Cost Estimates</h2>
      <div className="row">
        <div className="col">
          <label>Cluster</label>
          <select value={selectedCluster} onChange={(e) => setSelectedCluster(e.target.value)}>
            <option value="">-- select cluster --</option>
            {clusters.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col actions">
          <button className="action-button" onClick={onEstimate}>Estimate</button>
        </div>
      </div>

      {estimate && (
        <div style={{marginTop:12}}>
          <div>Droplets: {estimate.droplet_count}</div>
          <div>Hourly cost: {estimate.hourly_cost}</div>
          <div>Estimated monthly: {estimate.monthly_cost}</div>
        </div>
      )}
    </div>
  )
}

export default BillingPanel;
