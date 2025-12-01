/**
 * WebSocket-related types and interfaces
 */

/**
 * Enum for WebSocket message types
 */
export enum MessageType {
  INITIAL_STATE = 'initial_state',
  CODE_UPDATE = 'code_update',
  ERROR = 'error',
}

/**
 * Base WebSocket message structure
 */
export interface WebSocketMessage {
  type: MessageType | string
  code?: string
  timestamp?: number
  message?: string
  roomId?: string
}

/**
 * Initial state message sent when user joins a room
 */
export interface InitialStateMessage extends WebSocketMessage {
  type: MessageType.INITIAL_STATE
  code: string
  roomId: string
}

/**
 * Code update message for real-time synchronization
 */
export interface CodeUpdateMessage extends WebSocketMessage {
  type: MessageType.CODE_UPDATE
  code: string
  timestamp: number
}

/**
 * Error message from WebSocket
 */
export interface ErrorMessage extends WebSocketMessage {
  type: MessageType.ERROR
  message: string
}
