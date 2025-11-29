import React, {useEffect, useState} from 'react';
import type { CreateAutoscalePolicyRequest } from '../models/autoscale';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (req: CreateAutoscalePolicyRequest) => Promise<void> | void;
  initial?: CreateAutoscalePolicyRequest | null;
  editing?: boolean;
  clusters?: any[];
  defaultCluster?: string;
}

export const PolicyEditor: React.FC<Props> = ({ open, onClose, onSave, initial = null, editing = false, clusters = [], defaultCluster = '' }) => {
  const [form, setForm] = useState<CreateAutoscalePolicyRequest>(initial ?? {
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
    if (initial) setForm(initial);
    else if (defaultCluster) {
      // set default cluster when opening without initial
      setForm((f) => ({ ...f, cluster_id: defaultCluster }));
    }
  }, [initial, defaultCluster]);


  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div style={{position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1400}}>
      <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.35)'}} onClick={onClose}></div>

      <div style={{width:680, maxWidth:'95%', background:'white', borderRadius:8, boxShadow:'0 25px 75px rgba(0,0,0,0.25)', zIndex:1401, overflow:'hidden'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding: '12px 16px', borderBottom:'1px solid #e6e9ef'}}>
          <div style={{fontWeight:700}}>{editing ? 'Edit policy' : 'New policy'}</div>
          <div>
            <button className="action-button" onClick={onClose}>Close</button>
          </div>
        </div>

        <div style={{padding: 16}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8}}>
            {/** cluster selector */}
            <div>
              <label style={{display:'block', fontSize:'0.85rem', color:'#6b7280'}}>Cluster</label>
              <select data-testid="editor-cluster" value={form.cluster_id} onChange={(e) => setForm({...form, cluster_id: e.target.value})}>
                <option value="">-- select cluster --</option>
                {(clusters || []).map((c: any) => <option value={c.id} key={c.id}>{c.name}</option>)}
              </select>
            </div>
            <input data-testid="editor-name" placeholder="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
            <select data-testid="editor-type" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
              <option value="metrics">Metrics</option>
              <option value="time_of_day">Time of day</option>
              <option value="cost">Cost</option>
            </select>

            <input type="number" placeholder="Min replicas" value={form.min_replicas} onChange={(e) => setForm({...form, min_replicas: Number(e.target.value)})} />
            <input type="number" placeholder="Max replicas" value={form.max_replicas} onChange={(e) => setForm({...form, max_replicas: Number(e.target.value)})} />

            {form.type === 'metrics' && (
              <>
                <select value={form.metric_type} onChange={(e) => setForm({...form, metric_type: e.target.value})}>
                  <option value="cpu">CPU</option>
                  <option value="memory">Memory</option>
                  <option value="network">Network</option>
                </select>
                <input step="0.01" type="number" placeholder="Trigger (0-1)" value={form.metric_trigger} onChange={(e) => setForm({...form, metric_trigger: Number(e.target.value)})} />
              </>
            )}

            {form.type === 'time_of_day' && (
              <input placeholder="Time window eg: 08:00-18:00" value={form.time_window || ''} onChange={(e) => setForm({...form, time_window: e.target.value})} />
            )}

            {form.type === 'cost' && (
              <input type="number" placeholder="Cost limit" value={form.cost_limit || '' as any} onChange={(e) => setForm({...form, cost_limit: Number(e.target.value) || undefined})} />
            )}
          </div>

          <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
            <button aria-label="Cancel" className="action-button secondary" onClick={onClose}>Cancel</button>
            <button data-testid="editor-save" aria-label="Save policy" className="action-button primary" onClick={() => onSave(form)} disabled={!form.name || !form.cluster_id}>{editing ? 'Save' : 'Create'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyEditor;
