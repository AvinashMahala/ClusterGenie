import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import './Toast.scss';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms
}

interface ToastContextValue {
  addToast: (t: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    const item: ToastItem = { id, ...t };
    setToasts((s) => [item, ...s]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((s) => s.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Toast container - top-right */}
      <div className="toast-portal" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const Toast: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const { id, type, title, message, duration = 4000 } = toast;

  useEffect(() => {
    const t = setTimeout(() => onClose(), duration);
    return () => clearTimeout(t);
  }, [id, duration, onClose]);

  return (
    <div className={`toast ${type}`} role="status">
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        <div className="toast-message">{message}</div>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">×</button>
    </div>
  );
};

export default ToastProvider;
