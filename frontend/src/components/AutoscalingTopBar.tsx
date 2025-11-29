import React, { useEffect, useState } from 'react';
import { MonitoringService } from '../services';

const monitoringSvc = new MonitoringService();

interface Props {
  clusters: any[];
  selectedCluster: string;
  setSelectedCluster: (id: string) => void;
  onEvaluate: () => void;
  onRefresh: () => void;
  onNewPolicy: () => void;
}

export const AutoscalingTopBar: React.FC<Props> = ({ clusters, selectedCluster, setSelectedCluster, onEvaluate, onRefresh, onNewPolicy }) => {
  const [cpuAvg, setCpuAvg] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCpu() {
      if (!selectedCluster) {
        setCpuAvg(null);
        return;
      }
      try {
        const res = await monitoringSvc.getMetrics(selectedCluster, 'cpu', 1, 12);
        const m = res.metrics || [];
        if (m.length === 0) {
          setCpuAvg(null);
          return;
        }
        const avg = m.reduce((acc, v) => acc + Number(v.value), 0) / m.length;
        setCpuAvg(Number(avg.toFixed(1)));
      } catch (err) {
        setCpuAvg(null);
        // swallow — parent may show toasts later
      }
    }

    fetchCpu();
  }, [selectedCluster]);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="page-title">
          <h2>Autoscaling</h2>
          <div className="subtitle">Manage autoscaling policies and evaluate simulations</div>
        </div>

        <div>
          <label style={{display: 'block', fontSize: '0.85rem', color: '#6b7280'}}>Cluster</label>
          <select value={selectedCluster} onChange={(e) => setSelectedCluster(e.target.value)}>
            <option value="">-- select cluster --</option>
            {clusters.map((c) => (
              <option value={c.id} key={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{display:'flex', gap: '0.75rem', marginLeft: '1rem'}}>
          <div style={{fontSize: '0.9rem'}}>
            <div style={{fontWeight:700}}>{cpuAvg === null ? '—' : `${cpuAvg}%`}</div>
            <div style={{fontSize: '0.8rem', color:'#6b7280'}}>CPU avg</div>
          </div>

          <div style={{fontSize: '0.9rem'}}>
            <div style={{fontWeight:700}}>{selectedCluster ? 'n/a' : '—'}</div>
            <div style={{fontSize: '0.8rem', color:'#6b7280'}}>Replicas</div>
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <div style={{display: 'flex', gap: '6px'}}>
          <button className="action-button" onClick={onEvaluate} disabled={!selectedCluster}>Evaluate</button>
          <button className="action-button secondary" onClick={onRefresh} disabled={!selectedCluster}>Refresh</button>
        </div>

        <div>
          <button className="action-button primary" onClick={onNewPolicy} disabled={!selectedCluster}>New Policy</button>
        </div>
      </div>
    </div>
  );
};

export default AutoscalingTopBar;
