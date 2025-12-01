import React, { memo } from 'react'
import './LoadingSpinner.css'

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
  label?: string
}

/**
 * LoadingSpinner component
 * Displays an animated loading spinner with optional label
 */
const LoadingSpinnerComponent: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color,
  label,
}) => {
  return (
    <div className="loading-spinner-container" role="status" aria-live="polite">
      <div
        className={`loading-spinner loading-spinner-${size}`}
        style={color ? { borderTopColor: color } : undefined}
        aria-hidden="true"
      />
      {label && <span className="loading-spinner-label">{label}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
export const LoadingSpinner = memo(LoadingSpinnerComponent)
