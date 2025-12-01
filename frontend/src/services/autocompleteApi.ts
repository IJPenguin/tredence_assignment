/**
 * Autocomplete API service
 * Handles HTTP requests for AI-style autocomplete suggestions
 */

import { AutocompleteRequest, AutocompleteResponse } from '../types/autocomplete'
import { API_ENDPOINTS, CONFIG } from '../utils/constants'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

/**
 * Fetches an autocomplete suggestion from the backend
 * @param code - The current code content
 * @param cursorPosition - The numeric index of the cursor position
 * @param language - The programming language (e.g., 'python', 'javascript')
 * @returns Promise resolving to AutocompleteResponse with suggestion and confidence
 * @throws Error if the request fails or returns invalid data
 */
export async function getAutocompleteSuggestion(
  code: string,
  cursorPosition: number,
  language: string
): Promise<AutocompleteResponse> {
  try {
    const requestBody: AutocompleteRequest = {
      code,
      cursorPosition,
      language,
    }

    const response = await fetchWithTimeout(
      API_ENDPOINTS.AUTOCOMPLETE,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      CONFIG.AUTOCOMPLETE_TIMEOUT_MS
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      // Handle specific HTTP status codes
      if (response.status === 400) {
        throw new Error('Invalid request - please check your input')
      }

      if (response.status === 500) {
        throw new Error('Server error - autocomplete temporarily unavailable')
      }

      if (response.status === 503) {
        throw new Error('Service unavailable - autocomplete temporarily unavailable')
      }

      throw new Error(
        errorData.detail ||
          `Failed to get autocomplete suggestion: ${response.status} ${response.statusText}`
      )
    }

    const data: AutocompleteResponse = await response.json()

    // Validate response structure
    if (typeof data.suggestion !== 'string' || typeof data.confidence !== 'number') {
      throw new Error('Invalid response from server - please try again')
    }

    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching autocomplete suggestion')
  }
}
