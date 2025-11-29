import React, { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  results?: any;
}

export const EvaluateModal: React.FC<Props> = ({ open, onClose, results }) => {
  if (!open) return null;

  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { closeRef.current?.focus(); }, []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={{position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1500}}>
      <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.4)'}} onClick={onClose}></div>

      <div style={{width:720, maxWidth:'96%', background:'white', borderRadius:8, boxShadow:'0 30px 90px rgba(0,0,0,0.25)', zIndex:1501, overflow:'hidden'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding: 12, borderBottom:'1px solid #e6e9ef'}}>
          <div style={{fontWeight:700}}>Evaluate result</div>
          <div><button ref={closeRef} className="action-button" onClick={onClose}>Close</button></div>
        </div>

        <div style={{padding: 16}}>
          <div style={{display:'flex', gap:16}}>
            <div style={{flex:1}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <div style={{fontWeight:700}}>Summary</div>
                <div style={{fontSize:'0.9rem', color:'#6b7280'}}>{results?.cluster_id ? `cluster ${results.cluster_id}` : ''}</div>
              </div>

              <div style={{padding:8, borderRadius:6, border:'1px solid #eef2ff', background:'#fbfbff', marginTop:8}}>
                <pre style={{whiteSpace:'pre-wrap', fontSize:'0.9rem', margin:0}}>{JSON.stringify(results || {}, null, 2)}</pre>
              </div>
            </div>

            <div style={{width:260}}>
              <div style={{fontWeight:700}}>Actions</div>
              <div style={{marginTop:8}}>
                {(results?.actions || []).length === 0 && <div className="muted">No actions taken</div>}
                <ul style={{marginTop:8, paddingLeft:16}}>
                  {(results?.actions || []).map((a:string, idx:number) => <li key={idx} style={{fontSize:'0.9rem'}}>{a}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluateModal;
