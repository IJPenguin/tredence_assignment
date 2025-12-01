/**
 * Room API service
 * Handles HTTP requests related to room operations
 */

import { RoomResponse } from '../types/room'
import { API_ENDPOINTS, CONFIG } from '../utils/constants'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

/**
 * Creates a new collaboration room
 * @returns Promise resolving to RoomResponse with the generated room ID
 * @throws Error if the request fails or returns invalid data
 */
export async function createRoom(): Promise<RoomResponse> {
  try {
    const response = await fetchWithTimeout(
      API_ENDPOINTS.ROOMS,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
      CONFIG.API_TIMEOUT_MS
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      // Handle specific HTTP status codes
      if (response.status === 500) {
        throw new Error('Server error - please try again later')
      }

      if (response.status === 503) {
        throw new Error('Service unavailable - please try again later')
      }

      throw new Error(
        errorData.detail || `Failed to create room: ${response.status} ${response.statusText}`
      )
    }

    const data: RoomResponse = await response.json()

    // Validate response structure
    if (!data.roomId || typeof data.roomId !== 'string') {
      throw new Error('Invalid response from server - please try again')
    }

    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while creating room')
  }
}
