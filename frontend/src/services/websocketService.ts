/**
 * WebSocket service for real-time code synchronization
 * Manages WebSocket connections, message handling, and reconnection logic
 */

import {
  WebSocketMessage,
  MessageType,
  InitialStateMessage,
  CodeUpdateMessage,
  ErrorMessage,
} from '../types/websocket'
import { API_ENDPOINTS, CONFIG } from '../utils/constants'

/**
 * Connection state enum
 */
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

/**
 * Event listener types
 */
type InitialStateListener = (code: string, roomId: string) => void
type CodeUpdateListener = (code: string, timestamp: number) => void
type ErrorListener = (message: string) => void
type ConnectionStateListener = (state: ConnectionState) => void

/**
 * WebSocket service class for managing real-time connections
 */
export class WebSocketService {
  private ws: WebSocket | null = null
  private roomId: string | null = null
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED
  private reconnectAttempts: number = 0
  private reconnectTimeout: number | null = null
  private shouldReconnect: boolean = true

  // Event listeners
  private initialStateListeners: InitialStateListener[] = []
  private codeUpdateListeners: CodeUpdateListener[] = []
  private errorListeners: ErrorListener[] = []
  private connectionStateListeners: ConnectionStateListener[] = []

  /**
   * Connects to a WebSocket for the specified room
   * @param roomId - The room ID to connect to
   */
  public connect(roomId: string): void {
    // Disconnect existing connection if any
    if (this.ws) {
      this.disconnect()
    }

    this.roomId = roomId
    this.shouldReconnect = true
    this.setConnectionState(ConnectionState.CONNECTING)

    try {
      const wsUrl = API_ENDPOINTS.WEBSOCKET(roomId)
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onerror = this.handleError.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.setConnectionState(ConnectionState.ERROR)
      this.notifyError('Failed to create WebSocket connection')
      this.attemptReconnect()
    }
  }

  /**
   * Disconnects the WebSocket connection
   */
  public disconnect(): void {
    this.shouldReconnect = false
    this.clearReconnectTimeout()

    if (this.ws) {
      // Remove event listeners to prevent reconnection
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onerror = null
      this.ws.onclose = null

      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close()
      }

      this.ws = null
    }

    this.roomId = null
    this.reconnectAttempts = 0
    this.setConnectionState(ConnectionState.DISCONNECTED)
  }

  /**
   * Sends a code update message
   * @param code - The updated code content
   * @param timestamp - The timestamp of the update
   */
  public sendCodeUpdate(code: string, timestamp: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send code update: WebSocket is not connected')
      return
    }

    const message: CodeUpdateMessage = {
      type: MessageType.CODE_UPDATE,
      code,
      timestamp,
    }

    try {
      this.ws.send(JSON.stringify(message))
    } catch (error) {
      console.error('Failed to send code update:', error)
      this.notifyError('Failed to send code update')
    }
  }

  /**
   * Gets the current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState
  }

  /**
   * Registers a listener for initial state messages
   */
  public onInitialState(listener: InitialStateListener): () => void {
    this.initialStateListeners.push(listener)
    return () => {
      this.initialStateListeners = this.initialStateListeners.filter(l => l !== listener)
    }
  }

  /**
   * Registers a listener for code update messages
   */
  public onCodeUpdate(listener: CodeUpdateListener): () => void {
    this.codeUpdateListeners.push(listener)
    return () => {
      this.codeUpdateListeners = this.codeUpdateListeners.filter(l => l !== listener)
    }
  }

  /**
   * Registers a listener for error messages
   */
  public onError(listener: ErrorListener): () => void {
    this.errorListeners.push(listener)
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener)
    }
  }

  /**
   * Registers a listener for connection state changes
   */
  public onConnectionStateChange(listener: ConnectionStateListener): () => void {
    this.connectionStateListeners.push(listener)
    return () => {
      this.connectionStateListeners = this.connectionStateListeners.filter(l => l !== listener)
    }
  }

  /**
   * Handles WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connected to room:', this.roomId)
    this.reconnectAttempts = 0
    this.setConnectionState(ConnectionState.CONNECTED)
  }

  /**
   * Handles incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)

      switch (message.type) {
        case MessageType.INITIAL_STATE:
          this.handleInitialState(message as InitialStateMessage)
          break
        case MessageType.CODE_UPDATE:
          this.handleCodeUpdate(message as CodeUpdateMessage)
          break
        case MessageType.ERROR:
          this.handleErrorMessage(message as ErrorMessage)
          break
        default:
          console.warn('Unknown message type:', message.type)
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
      this.notifyError('Failed to parse message from server')
    }
  }

  /**
   * Handles initial state message
   */
  private handleInitialState(message: InitialStateMessage): void {
    if (message.code !== undefined && message.roomId) {
      this.initialStateListeners.forEach(listener => {
        try {
          listener(message.code, message.roomId)
        } catch (error) {
          console.error('Error in initial state listener:', error)
        }
      })
    }
  }

  /**
   * Handles code update message
   */
  private handleCodeUpdate(message: CodeUpdateMessage): void {
    if (message.code !== undefined && message.timestamp !== undefined) {
      this.codeUpdateListeners.forEach(listener => {
        try {
          listener(message.code, message.timestamp)
        } catch (error) {
          console.error('Error in code update listener:', error)
        }
      })
    }
  }

  /**
   * Handles error message from server
   */
  private handleErrorMessage(message: ErrorMessage): void {
    if (message.message) {
      console.error('WebSocket error message:', message.message)
      this.notifyError(message.message)
    }
  }

  /**
   * Handles WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event)
    this.setConnectionState(ConnectionState.ERROR)
    this.notifyError('WebSocket connection error')
  }

  /**
   * Handles WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason)
    this.ws = null

    // Handle specific close codes
    if (event.code === 4004) {
      // Room not found - don't reconnect
      this.shouldReconnect = false
      this.setConnectionState(ConnectionState.ERROR)
      this.notifyError('Room not found - please check the room ID')
      return
    }

    if (event.code === 1008) {
      // Policy violation - don't reconnect
      this.shouldReconnect = false
      this.setConnectionState(ConnectionState.ERROR)
      this.notifyError('Connection rejected by server')
      return
    }

    if (this.shouldReconnect) {
      this.setConnectionState(ConnectionState.DISCONNECTED)
      this.attemptReconnect()
    } else {
      this.setConnectionState(ConnectionState.DISCONNECTED)
    }
  }

  /**
   * Attempts to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (!this.shouldReconnect || !this.roomId) {
      return
    }

    if (this.reconnectAttempts >= CONFIG.WS_MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached')
      this.setConnectionState(ConnectionState.ERROR)
      this.notifyError('Failed to reconnect after multiple attempts')
      return
    }

    this.reconnectAttempts++
    const delay = this.calculateReconnectDelay()

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimeout = window.setTimeout(() => {
      if (this.shouldReconnect && this.roomId) {
        this.connect(this.roomId)
      }
    }, delay)
  }

  /**
   * Calculates reconnection delay with exponential backoff
   */
  private calculateReconnectDelay(): number {
    const baseDelay = CONFIG.WS_RECONNECT_DELAY_MS
    const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts - 1)
    const maxDelay = 30000 // 30 seconds max
    return Math.min(exponentialDelay, maxDelay)
  }

  /**
   * Clears the reconnection timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  /**
   * Sets the connection state and notifies listeners
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state
      this.connectionStateListeners.forEach(listener => {
        try {
          listener(state)
        } catch (error) {
          console.error('Error in connection state listener:', error)
        }
      })
    }
  }

  /**
   * Notifies error listeners
   */
  private notifyError(message: string): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(message)
      } catch (error) {
        console.error('Error in error listener:', error)
      }
    })
  }
}

// Export a singleton instance
export const websocketService = new WebSocketService()
