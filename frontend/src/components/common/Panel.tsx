import React from 'react';
import './Panel.scss';

export interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export function Panel({ children, className = '' }: PanelProps) {
  return (
    <div className={`panel ${className}`}>
      {children}
    </div>
  );
}

export interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PanelHeader({ title, subtitle, icon, actions }: PanelHeaderProps) {
  return (
    <div className="panel-header">
      <div className="panel-header-content">
        {icon && <div className="panel-icon">{icon}</div>}
        <div className="panel-title-section">
          <h1 className="panel-title">{title}</h1>
          {subtitle && <p className="panel-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="panel-actions">{actions}</div>}
    </div>
  );
}

export interface PanelContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PanelContent({ children, className = '' }: PanelContentProps) {
  return (
    <div className={`panel-content ${className}`}>
      {children}
    </div>
  );
}