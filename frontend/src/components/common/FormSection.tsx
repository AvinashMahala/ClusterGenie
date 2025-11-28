import React from 'react';
import './FormSection.scss';

export interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}

export function FormField({ label, children, error, required }: FormFieldProps) {
  return (
    <div className="form-field">
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function FormSection({ title, children, actions, className = '' }: FormSectionProps) {
  return (
    <div className={`form-section ${className}`}>
      {title && <h2 className="form-section-title">{title}</h2>}
      <div className="form-content">
        {children}
      </div>
      {actions && <div className="form-actions">{actions}</div>}
    </div>
  );
}

export interface FormGridProps {
  children: React.ReactNode;
  columns?: number;
  className?: string;
}

export function FormGrid({ children, columns = 2, className = '' }: FormGridProps) {
  return (
    <div
      className={`form-grid ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {children}
    </div>
  );
}