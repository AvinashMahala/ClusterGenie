import React from 'react';
import './EmptyState.scss';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, actions, className = '' }: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      {icon && <div className="empty-icon">{icon}</div>}
      <h3>{title}</h3>
      <p>{description}</p>
      {actions && <div className="empty-actions">{actions}</div>}
    </div>
  );
}