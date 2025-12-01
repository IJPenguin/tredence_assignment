/**
 * Room-related types and interfaces
 */

/**
 * Represents a collaboration room
 */
export interface Room {
  roomId: string
  code: string
  createdAt?: string
  updatedAt?: string
}

/**
 * Response from room creation endpoint
 */
export interface RoomResponse {
  roomId: string
}
