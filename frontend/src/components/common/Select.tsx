import React from 'react';
import './Select.scss';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled';
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({
    label,
    error,
    icon,
    size = 'md',
    variant = 'default',
    options = [],
    placeholder,
    className = '',
    children,
    ...props
  }, ref) => {
    const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`select-wrapper cg-select-wrapper ${size} ${variant} ${error ? 'error' : ''} ${className}`}>
        {label && (
          <label htmlFor={selectId} className="select-label">
            {label}
            {props.required && <span className="required">*</span>}
          </label>
        )}
        <div className="select-container">
          {icon && <div className="select-icon">{icon}</div>}
          <select
            ref={ref}
            id={selectId}
            className="select-field"
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
            {children}
          </select>
          <div className="select-arrow">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <p className="select-error">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';