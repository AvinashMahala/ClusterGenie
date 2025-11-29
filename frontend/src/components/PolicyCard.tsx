import React, { useState } from 'react';
import './PolicyCard.scss';
import type { AutoscalePolicy } from '../models/autoscale';

interface Props {
  policy: AutoscalePolicy;
  onDelete: (id: string) => void;
  onToggle?: (id: string, enabled: boolean) => void;
  onEdit?: (p: AutoscalePolicy) => void;
  onDuplicate?: (p: AutoscalePolicy) => void;
  onOpen?: (p: AutoscalePolicy) => void;
}

export const PolicyCard: React.FC<Props> = ({ policy, onDelete, onToggle, onEdit, onDuplicate, onOpen }) => {
  const [enabled, setEnabled] = useState<boolean>(!!policy.enabled);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (onToggle) onToggle(policy.id, next);
  };

  return (
    <div data-testid={`policy-${policy.id}`} className="policy-card" role="article" aria-label={`policy-${policy.name}`}>
      <div className="policy-head">
        <div className="policy-icon" aria-hidden>{(policy.name || '?').slice(0,2).toUpperCase()}</div>
        <div style={{flex:1}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
            <div style={{display:'flex', alignItems:'center', gap:8, cursor: onOpen ? 'pointer' : 'default'}} onClick={() => onOpen && onOpen(policy)} tabIndex={onOpen ? 0 : undefined} onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) onOpen(policy); }}>
              <strong data-testid={`policy-name-${policy.id}`}>{policy.name}</strong>
              <span className="status-chip">{policy.type}</span>
            </div>
            <div style={{textAlign:'right'}} className="muted">{enabled ? 'Enabled' : 'Disabled'}</div>
          </div>
          <div className="small muted" style={{marginTop:6}}>min:{policy.min_replicas} • max:{policy.max_replicas} {policy.metric_type ? `• ${policy.metric_type} trig=${policy.metric_trigger}` : ''}</div>
        </div>
      </div>

      <div className="card-actions">
        <div style={{display:'flex', alignItems:'center', gap: '0.5rem'}}>
          <label style={{display:'inline-flex', alignItems:'center', gap:'0.4rem'}}>
            <input type="checkbox" checked={enabled} onChange={handleToggle} aria-label={`enable-${policy.id}`} />
            <span style={{fontSize:'0.85rem', color:'#6b7280'}}>{enabled ? 'Enabled' : 'Disabled'}</span>
          </label>

          <button aria-label={`Edit ${policy.name}`} className="action-button small" onClick={() => onEdit && onEdit(policy)}>Edit</button>
          <button aria-label={`Duplicate ${policy.name}`} className="action-button small" onClick={() => onDuplicate && onDuplicate(policy)}>Duplicate</button>
          <button aria-label={`Delete ${policy.name}`} className="action-button small" onClick={() => onDelete(policy.id)}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default PolicyCard;
