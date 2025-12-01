import React, { memo } from 'react'
import { Toast } from './Toast'
import type { ToastType } from './Toast'
import './ToastContainer.css'

export type { ToastType }

export interface ToastData {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export interface ToastContainerProps {
  toasts: ToastData[]
  onRemoveToast: (id: string) => void
}

/**
 * ToastContainer component for managing multiple toast notifications
 * Displays toasts in a fixed position on the screen
 */
const ToastContainerComponent: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
export const ToastContainer = memo(ToastContainerComponent)
