import React from 'react';
import './Card.scss';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  border = true,
  hover = false,
  onClick
}: CardProps) {
  return (
    <div
      className={`card ${padding} ${shadow} ${border ? 'border' : ''} ${hover ? 'hover' : ''} ${onClick ? 'clickable' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, icon, actions, className = '' }: CardHeaderProps) {
  return (
    <div className={`card-header ${className}`}>
      <div className="card-header-content">
        {icon && <div className="card-icon">{icon}</div>}
        {(title || subtitle) && (
          <div className="card-title-section">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
        )}
      </div>
      {actions && <div className="card-actions">{actions}</div>}
    </div>
  );
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`card-content ${className}`}>
      {children}
    </div>
  );
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`card-footer ${className}`}>
      {children}
    </div>
  );
}