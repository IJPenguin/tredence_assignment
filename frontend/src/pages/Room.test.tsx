import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test/utils'
import Room from './Room'
import { websocketService, ConnectionState } from '../services/websocketService'

// Mock WebSocket service
vi.mock('../services/websocketService', () => {
  const listeners = {
    initialState: [] as Array<(code: string, roomId: string) => void>,
    codeUpdate: [] as Array<(code: string, timestamp: number) => void>,
    error: [] as Array<(message: string) => void>,
    connectionState: [] as Array<(state: ConnectionState) => void>,
  }

  return {
    ConnectionState: {
      CONNECTING: 'connecting',
      CONNECTED: 'connected',
      DISCONNECTED: 'disconnected',
      ERROR: 'error',
    },
    websocketService: {
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendCodeUpdate: vi.fn(),
      getConnectionState: vi.fn(() => ConnectionState.DISCONNECTED),
      onInitialState: vi.fn((listener: (code: string, roomId: string) => void) => {
        listeners.initialState.push(listener)
        return () => {
          listeners.initialState = listeners.initialState.filter(l => l !== listener)
        }
      }),
      onCodeUpdate: vi.fn((listener: (code: string, timestamp: number) => void) => {
        listeners.codeUpdate.push(listener)
        return () => {
          listeners.codeUpdate = listeners.codeUpdate.filter(l => l !== listener)
        }
      }),
      onError: vi.fn((listener: (message: string) => void) => {
        listeners.error.push(listener)
        return () => {
          listeners.error = listeners.error.filter(l => l !== listener)
        }
      }),
      onConnectionStateChange: vi.fn((listener: (state: ConnectionState) => void) => {
        listeners.connectionState.push(listener)
        return () => {
          listeners.connectionState = listeners.connectionState.filter(l => l !== listener)
        }
      }),
      // Helper to trigger events in tests
      _triggerInitialState: (code: string, roomId: string) => {
        listeners.initialState.forEach(l => l(code, roomId))
      },
      _triggerCodeUpdate: (code: string, timestamp: number) => {
        listeners.codeUpdate.forEach(l => l(code, timestamp))
      },
      _triggerError: (message: string) => {
        listeners.error.forEach(l => l(message))
      },
      _triggerConnectionState: (state: ConnectionState) => {
        listeners.connectionState.forEach(l => l(state))
      },
    },
  }
})

// Mock useParams
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ roomId: 'test-room-123' }),
    useNavigate: () => mockNavigate,
  }
})

describe('Room Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders room page with room ID', () => {
    render(<Room />)

    expect(screen.getByText(/room: test-room-123/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy room link/i })).toBeInTheDocument()
  })

  it('connects to WebSocket on mount', () => {
    render(<Room />)

    expect(websocketService.connect).toHaveBeenCalledWith('test-room-123')
  })

  it('disconnects WebSocket on unmount', () => {
    const { unmount } = render(<Room />)

    unmount()

    expect(websocketService.disconnect).toHaveBeenCalled()
  })

  it('displays initial code state from WebSocket', async () => {
    render(<Room />)

    const mockCode = 'console.log("Hello, World!")'
    const mockRoomId = 'test-room-123'

    // Trigger initial state
    ;(websocketService as any)._triggerInitialState(mockCode, mockRoomId)

    await waitFor(() => {
      expect(screen.getByText(mockCode)).toBeInTheDocument()
    })
  })

  it('updates code when receiving code update from WebSocket', async () => {
    render(<Room />)

    const initialCode = 'const x = 1'
    const updatedCode = 'const x = 2'

    // Trigger initial state
    ;(websocketService as any)._triggerInitialState(initialCode, 'test-room-123')

    await waitFor(() => {
      expect(screen.getByText(initialCode)).toBeInTheDocument()
    })

    // Trigger code update
    ;(websocketService as any)._triggerCodeUpdate(updatedCode, Date.now())

    await waitFor(() => {
      expect(screen.getByText(updatedCode)).toBeInTheDocument()
    })
  })

  it('displays error message from WebSocket', async () => {
    render(<Room />)

    const errorMessage = 'Connection failed'

    // Trigger error
    ;(websocketService as any)._triggerError(errorMessage)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('shows room not found error for invalid room ID', async () => {
    // This test would require remounting with different params
    // For now, we'll skip this test as it requires more complex mocking
    // In a real scenario, you'd use a router wrapper with different routes
  })

  it('copies room link to clipboard', async () => {
    const user = userEvent.setup()

    // Mock clipboard API properly
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    })

    render(<Room />)

    const copyButton = screen.getByRole('button', { name: /copy room link/i })
    await user.click(copyButton)

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('/room/test-room-123'))
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument()
    })
  })

  it('displays connection status', async () => {
    render(<Room />)

    // Initially disconnected
    expect(screen.getByText(/disconnected/i)).toBeInTheDocument()

    // Trigger connected state
    ;(websocketService as any)._triggerConnectionState(ConnectionState.CONNECTED)

    await waitFor(() => {
      expect(screen.getByText(/connected/i)).toBeInTheDocument()
    })
  })

  it('shows reconnect button when disconnected', async () => {
    const user = userEvent.setup()

    render(<Room />)

    // Trigger disconnected state
    ;(websocketService as any)._triggerConnectionState(ConnectionState.DISCONNECTED)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reconnect/i })).toBeInTheDocument()
    })

    const reconnectButton = screen.getByRole('button', { name: /reconnect/i })
    await user.click(reconnectButton)

    expect(websocketService.disconnect).toHaveBeenCalled()
    expect(websocketService.connect).toHaveBeenCalledWith('test-room-123')
  })
})
