import { useState, useCallback } from 'react'
import type { ToastData, ToastType } from '../components/ToastContainer'

/**
 * Custom hook for managing toast notifications
 * Provides methods to show and remove toasts
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      const newToast: ToastData = { id, message, type, duration }

      setToasts(prev => [...prev, newToast])

      return id
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showSuccess = useCallback(
    (message: string, duration?: number) => showToast(message, 'success', duration),
    [showToast]
  )

  const showError = useCallback(
    (message: string, duration?: number) => showToast(message, 'error', duration),
    [showToast]
  )

  const showWarning = useCallback(
    (message: string, duration?: number) => showToast(message, 'warning', duration),
    [showToast]
  )

  const showInfo = useCallback(
    (message: string, duration?: number) => showToast(message, 'info', duration),
    [showToast]
  )

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}
