/**
 * Validation utilities for user input
 */

/**
 * Validates a room ID format
 * Room IDs should be alphanumeric and between 4-50 characters
 * @param roomId - The room ID to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateRoomId(roomId: string): { isValid: boolean; error?: string } {
  if (!roomId || roomId.trim().length === 0) {
    return { isValid: false, error: 'Room ID cannot be empty' }
  }

  const trimmedId = roomId.trim()

  if (trimmedId.length < 4) {
    return { isValid: false, error: 'Room ID must be at least 4 characters long' }
  }

  if (trimmedId.length > 50) {
    return { isValid: false, error: 'Room ID must be less than 50 characters' }
  }

  // Allow alphanumeric characters and hyphens
  const validPattern = /^[a-zA-Z0-9-]+$/
  if (!validPattern.test(trimmedId)) {
    return {
      isValid: false,
      error: 'Room ID can only contain letters, numbers, and hyphens',
    }
  }

  return { isValid: true }
}
