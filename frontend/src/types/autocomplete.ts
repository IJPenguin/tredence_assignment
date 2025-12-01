/**
 * Autocomplete-related types and interfaces
 */

/**
 * Request payload for autocomplete endpoint
 */
export interface AutocompleteRequest {
  code: string
  cursorPosition: number
  language: string
}

/**
 * Response from autocomplete endpoint
 */
export interface AutocompleteResponse {
  suggestion: string
  confidence: number
}
