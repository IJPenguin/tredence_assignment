/**
 * Utility for making fetch requests with timeout support
 */

/**
 * Fetch with timeout support
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise resolving to Response
 * @throws Error if timeout is reached or network error occurs
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      // Check if it's an abort error (timeout)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection and try again')
      }

      // Check for network errors
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network error - please check your internet connection')
      }

      throw error
    }

    throw new Error('An unexpected error occurred')
  }
}
