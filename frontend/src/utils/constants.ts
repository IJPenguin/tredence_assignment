// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

// API Endpoints
export const API_ENDPOINTS = {
  ROOMS: `${API_BASE_URL}/rooms`,
  AUTOCOMPLETE: `${API_BASE_URL}/autocomplete`,
  WEBSOCKET: (roomId: string) => `${WS_BASE_URL}/ws/${roomId}`,
} as const

// Configuration
export const CONFIG = {
  AUTOCOMPLETE_DEBOUNCE_MS: 600,
  CODE_UPDATE_DEBOUNCE_MS: 100,
  WS_RECONNECT_DELAY_MS: 1000,
  WS_MAX_RECONNECT_ATTEMPTS: 5,
  AUTOCOMPLETE_TIMEOUT_MS: 5000, // 5 second timeout for autocomplete requests
  API_TIMEOUT_MS: 10000, // 10 second timeout for general API requests
} as const

// Default values
export const DEFAULTS = {
  LANGUAGE: 'python',
  CODE: '',
} as const
