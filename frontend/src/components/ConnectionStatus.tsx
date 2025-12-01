import React, { memo } from 'react'
import { ConnectionState } from '../services/websocketService'
import './ConnectionStatus.css'

export interface ConnectionStatusProps {
  state: ConnectionState
  onReconnect?: () => void
}

/**
 * ConnectionStatus component
 * Displays connection state with colored indicator
 * Shows "Connected", "Connecting", "Disconnected" states
 * Adds reconnect button for disconnected state
 */
const ConnectionStatusComponent: React.FC<ConnectionStatusProps> = ({ state, onReconnect }) => {
  const getStatusConfig = () => {
    switch (state) {
      case ConnectionState.CONNECTED:
        return {
          text: 'Connected',
          className: 'connection-status-connected',
          ariaLabel: 'Connection status: Connected',
        }
      case ConnectionState.CONNECTING:
        return {
          text: 'Connecting...',
          className: 'connection-status-connecting',
          ariaLabel: 'Connection status: Connecting',
        }
      case ConnectionState.DISCONNECTED:
        return {
          text: 'Disconnected',
          className: 'connection-status-disconnected',
          ariaLabel: 'Connection status: Disconnected',
        }
      case ConnectionState.ERROR:
        return {
          text: 'Error',
          className: 'connection-status-error',
          ariaLabel: 'Connection status: Error',
        }
      default:
        return {
          text: 'Unknown',
          className: 'connection-status-disconnected',
          ariaLabel: 'Connection status: Unknown',
        }
    }
  }

  const config = getStatusConfig()
  const showReconnectButton =
    (state === ConnectionState.DISCONNECTED || state === ConnectionState.ERROR) && onReconnect

  return (
    <div className={`connection-status ${config.className}`} role="status" aria-live="polite">
      <span className="connection-status-indicator" aria-hidden="true" />
      <span className="connection-status-text" aria-label={config.ariaLabel}>
        {config.text}
      </span>
      {showReconnectButton && (
        <button
          className="connection-status-reconnect-btn"
          onClick={onReconnect}
          aria-label="Reconnect to room"
        >
          Reconnect
        </button>
      )}
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
export const ConnectionStatus = memo(ConnectionStatusComponent)
