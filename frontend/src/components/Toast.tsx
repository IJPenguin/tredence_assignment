import React, { useEffect, memo } from 'react'
import './Toast.css'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
  message: string
  type: ToastType
  duration?: number
  onClose: () => void
}

/**
 * Toast component for displaying temporary notifications
 * Automatically dismisses after specified duration
 */
const ToastComponent: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
        return 'ℹ'
      default:
        return ''
    }
  }

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="assertive">
      <span className="toast-icon" aria-hidden="true">
        {getIcon()}
      </span>
      <span className="toast-message">{message}</span>
      <button
        className="toast-close"
        onClick={onClose}
        aria-label="Close notification"
        type="button"
      >
        ×
      </button>
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
export const Toast = memo(ToastComponent)
