import React, { memo } from 'react'
import './Button.css'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  loading?: boolean
  children: React.ReactNode
}

/**
 * Button component with variants and loading state
 * Fully accessible with ARIA attributes
 */
const ButtonComponent: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const isDisabled = disabled || loading

  return (
    <button
      className={`btn btn-${variant} ${loading ? 'btn-loading' : ''} ${className}`}
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true">
          <svg className="spinner" viewBox="0 0 24 24">
            <circle className="spinner-circle" cx="12" cy="12" r="10" fill="none" strokeWidth="3" />
          </svg>
        </span>
      )}
      <span className={loading ? 'btn-content-loading' : ''}>{children}</span>
    </button>
  )
}

// Memoize component to prevent unnecessary re-renders
export const Button = memo(ButtonComponent)
