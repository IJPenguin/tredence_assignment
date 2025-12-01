import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store'
import { setRoomId, setCode, setConnectionStatus } from '../store/roomSlice'
import { websocketService, ConnectionState } from '../services/websocketService'
import { validateRoomId } from '../utils/validation'
import { ToastContainer, CodeEditor } from '../components'
import { useToast } from '../hooks/useToast'
import './Room.css'

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { code } = useAppSelector(state => state.room)
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  )
  const [copySuccess, setCopySuccess] = useState(false)
  const [roomNotFound, setRoomNotFound] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const { toasts, removeToast, showSuccess, showError, showInfo } = useToast()
  const isLocalChangeRef = useRef(false)

  // Validate room ID on mount
  useEffect(() => {
    if (roomId) {
      const validation = validateRoomId(roomId)
      if (!validation.isValid) {
        showError(validation.error || 'Invalid room ID')
        setRoomNotFound(true)
        return
      }
      dispatch(setRoomId(roomId))
    } else {
      showError('No room ID provided')
      setRoomNotFound(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, dispatch])

  // Memoized WebSocket event handlers
  const handleInitialState = useCallback(
    (code: string, receivedRoomId: string) => {
      console.log('Received initial state:', { code, receivedRoomId })
      dispatch(setCode(code))
      setRoomNotFound(false)
      showInfo('Connected to room')
    },
    [dispatch, showInfo]
  )

  const handleCodeUpdate = useCallback(
    (code: string, timestamp: number) => {
      console.log('Received code update:', { code, timestamp })
      // Only update if this wasn't a local change
      if (!isLocalChangeRef.current) {
        dispatch(setCode(code))
        // Show visual feedback for code synchronization
        setIsSyncing(true)
        setTimeout(() => setIsSyncing(false), 500)
      }
      isLocalChangeRef.current = false
    },
    [dispatch]
  )

  // Handle local code changes from the editor
  const handleEditorChange = useCallback(
    (newCode: string) => {
      isLocalChangeRef.current = true
      dispatch(setCode(newCode))
      // Send code update to WebSocket
      if (connectionState === ConnectionState.CONNECTED) {
        websocketService.sendCodeUpdate(newCode)
      }
    },
    [dispatch, connectionState]
  )

  const handleError = useCallback(
    (message: string) => {
      console.error('WebSocket error:', message)
      showError(message)

      // Check if it's a room not found error
      if (message.toLowerCase().includes('room not found')) {
        setRoomNotFound(true)
      }
    },
    [showError]
  )

  const handleConnectionStateChange = useCallback(
    (state: ConnectionState) => {
      console.log('Connection state changed:', state)
      setConnectionState(state)
      dispatch(setConnectionStatus(state === ConnectionState.CONNECTED))

      // Show toast notifications for connection state changes
      if (state === ConnectionState.CONNECTED) {
        showSuccess('Connected to room')
      } else if (state === ConnectionState.DISCONNECTED) {
        showError('Disconnected from room')
      } else if (state === ConnectionState.ERROR) {
        showError('Connection error occurred')
      }
    },
    [dispatch, showSuccess, showError]
  )

  // Connect to WebSocket on mount
  useEffect(() => {
    if (!roomId || roomNotFound) return

    // Connect to WebSocket
    websocketService.connect(roomId)

    // Listen for initial state
    const unsubscribeInitialState = websocketService.onInitialState(handleInitialState)

    // Listen for code updates
    const unsubscribeCodeUpdate = websocketService.onCodeUpdate(handleCodeUpdate)

    // Listen for errors
    const unsubscribeError = websocketService.onError(handleError)

    // Listen for connection state changes
    const unsubscribeConnectionState = websocketService.onConnectionStateChange(
      handleConnectionStateChange
    )

    // Cleanup on unmount
    return () => {
      unsubscribeInitialState()
      unsubscribeCodeUpdate()
      unsubscribeError()
      unsubscribeConnectionState()
      websocketService.disconnect()
    }
  }, [
    roomId,
    roomNotFound,
    handleInitialState,
    handleCodeUpdate,
    handleError,
    handleConnectionStateChange,
  ])

  // Handle copy room link
  const handleCopyRoomLink = useCallback(async () => {
    const roomLink = `${window.location.origin}/room/${roomId}`
    try {
      await navigator.clipboard.writeText(roomLink)
      setCopySuccess(true)
      showSuccess('Room link copied to clipboard!')
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy room link:', err)
      showError('Failed to copy room link')
    }
  }, [roomId, showSuccess, showError])

  // Handle manual reconnection
  const handleReconnect = useCallback(() => {
    if (roomId && !roomNotFound) {
      showInfo('Reconnecting...')
      websocketService.disconnect()
      websocketService.connect(roomId)
    }
  }, [roomId, roomNotFound, showInfo])

  // Handle going back to home
  const handleGoHome = useCallback(() => {
    navigate('/')
  }, [navigate])

  // Get connection status display
  const getConnectionStatusDisplay = useCallback(() => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return { text: 'Connected', className: 'status-connected' }
      case ConnectionState.CONNECTING:
        return { text: 'Connecting...', className: 'status-connecting' }
      case ConnectionState.DISCONNECTED:
        return { text: 'Disconnected', className: 'status-disconnected' }
      case ConnectionState.ERROR:
        return { text: 'Error', className: 'status-error' }
      default:
        return { text: 'Unknown', className: 'status-disconnected' }
    }
  }, [connectionState])

  const statusDisplay = getConnectionStatusDisplay()

  // Show room not found error
  if (roomNotFound) {
    return (
      <div className="room-container">
        <div className="error-container">
          <h1>Room Not Found</h1>
          <p className="error-message">
            The room "{roomId}" could not be found or the room ID is invalid.
          </p>
          <p className="error-hint">
            Please check the room ID and try again, or create a new room.
          </p>
          <button className="primary-button" onClick={handleGoHome}>
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="room-container">
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      <header className="room-header">
        <div className="room-info">
          <h1 className="room-title">Room: {roomId}</h1>
          <button className="copy-button" onClick={handleCopyRoomLink} title="Copy room link">
            {copySuccess ? '✓ Copied!' : '📋 Copy Room Link'}
          </button>
        </div>
        <div className={`connection-status ${statusDisplay.className}`}>
          <span className="status-indicator"></span>
          <span className="status-text">{statusDisplay.text}</span>
          {isSyncing && <span className="sync-indicator">⟳ Syncing...</span>}
          {(connectionState === ConnectionState.DISCONNECTED ||
            connectionState === ConnectionState.ERROR) && (
            <button className="reconnect-button" onClick={handleReconnect} title="Reconnect">
              🔄 Reconnect
            </button>
          )}
        </div>
      </header>

      <main className="editor-container">
        <CodeEditor
          value={code}
          onChange={handleEditorChange}
          language="javascript"
          theme="vs-dark"
          readOnly={connectionState !== ConnectionState.CONNECTED}
          enableAutocomplete={true}
        />
      </main>
    </div>
  )
}

export default Room
