import React from 'react';
import './StatusBadge.scss';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default';

export interface StatusBadgeProps {
  status: string;
  variant?: StatusType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function StatusBadge({
  status,
  variant,
  size = 'md',
  className = '',
  children
}: StatusBadgeProps) {
  const getVariantFromStatus = (status: string): StatusType => {
    if (variant) return variant;

    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'online':
      case 'healthy':
        return 'success';
      case 'pending':
      case 'provisioning':
      case 'running':
        return 'warning';
      case 'failed':
      case 'offline':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const badgeVariant = getVariantFromStatus(status);

  return (
    <span className={`status-badge ${badgeVariant} ${size} ${className}`}>
      <span className="status-indicator"></span>
      {children || status}
    </span>
  );
}