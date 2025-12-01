import React, { forwardRef } from 'react'
import './Input.css'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

/**
 * Input component with label, error message, and validation state
 * Fully accessible with ARIA attributes
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helperText ? `${inputId}-helper` : undefined
    const hasError = !!error

    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined

    return (
      <div className={`input-wrapper ${hasError ? 'input-wrapper-error' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`input ${hasError ? 'input-error' : ''} ${className}`}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          {...props}
        />
        {error && (
          <span id={errorId} className="input-error-message" role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={helperId} className="input-helper-text">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
