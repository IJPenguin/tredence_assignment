import { Component, ErrorInfo, ReactNode } from 'react'
import './ErrorBoundary.css'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary component
 * Catches and displays React errors gracefully
 * Adds retry mechanism
 * Logs errors to console
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details to console
    console.error('ErrorBoundary caught an error:', error)
    console.error('Error info:', errorInfo)

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // You could also log to an error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }

  handleRetry = (): void => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // If custom fallback is provided, use it
      if (fallback) {
        return fallback(error, this.handleRetry)
      }

      // Default error UI
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-content">
            <div className="error-boundary-icon" aria-hidden="true">
              ⚠️
            </div>
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-message">
              An unexpected error occurred. Please try again or refresh the page.
            </p>
            <details className="error-boundary-details">
              <summary className="error-boundary-summary">Error details</summary>
              <pre className="error-boundary-stack">
                <code>{error.toString()}</code>
                {this.state.errorInfo && <code>{this.state.errorInfo.componentStack}</code>}
              </pre>
            </details>
            <div className="error-boundary-actions">
              <button
                className="error-boundary-retry-btn"
                onClick={this.handleRetry}
                aria-label="Retry"
              >
                Try Again
              </button>
              <button
                className="error-boundary-refresh-btn"
                onClick={() => window.location.reload()}
                aria-label="Refresh page"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return children
  }
}
