import React from 'react';
import './ActionButton.scss';

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: React.ReactNode;
}

export function ActionButton({
    variant = 'primary',
    size = 'md',
    loading = false,
    children,
    className = '',
    disabled,
    ...props
}: ActionButtonProps) {
    return (
        <button
            className={`action-button cg-action-button ${variant} ${size} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="loading-spinner" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            )}
            {children}
        </button>
    );
}