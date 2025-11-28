import React from 'react';
import './Input.scss';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, size = 'md', variant = 'default', className = '', ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`input-wrapper ${size} ${variant} ${error ? 'error' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
            {props.required && <span className="required">*</span>}
          </label>
        )}
        <div className="input-container">
          {icon && <div className="input-icon">{icon}</div>}
          <input
            ref={ref}
            id={inputId}
            className="input-field"
            {...props}
          />
        </div>
        {error && <p className="input-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';