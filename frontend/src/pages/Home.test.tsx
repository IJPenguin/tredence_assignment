import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test/utils'
import Home from './Home'
import * as roomApi from '../services/roomApi'

// Mock the room API
vi.mock('../services/roomApi')

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Home Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the home page with create and join sections', () => {
    render(<Home />)

    expect(screen.getByText('Real-Time Pair Programming')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /create new room/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /join existing room/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create new room/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join room/i })).toBeInTheDocument()
  })

  it('creates a room and displays the room ID', async () => {
    const user = userEvent.setup()
    const mockRoomId = 'test-room-123'

    vi.mocked(roomApi.createRoom).mockResolvedValue({ roomId: mockRoomId })

    render(<Home />)

    const createButton = screen.getByRole('button', { name: /create new room/i })
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText(mockRoomId)).toBeInTheDocument()
    })

    expect(roomApi.createRoom).toHaveBeenCalledTimes(1)
  })

  it('shows loading state while creating room', async () => {
    const user = userEvent.setup()

    vi.mocked(roomApi.createRoom).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ roomId: 'test-123' }), 100))
    )

    render(<Home />)

    const createButton = screen.getByRole('button', { name: /create new room/i })
    await user.click(createButton)

    expect(screen.getByText(/creating/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(/creating/i)).not.toBeInTheDocument()
    })
  })

  it('handles room creation error', async () => {
    const user = userEvent.setup()

    vi.mocked(roomApi.createRoom).mockRejectedValue(new Error('Failed to create room'))

    render(<Home />)

    const createButton = screen.getByRole('button', { name: /create new room/i })
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText(/failed to create room/i)).toBeInTheDocument()
    })
  })

  it('navigates to room when joining with valid room ID', async () => {
    const user = userEvent.setup()
    const roomId = 'valid-room-id'

    render(<Home />)

    const input = screen.getByPlaceholderText(/enter room id/i)
    const joinButton = screen.getByRole('button', { name: /join room/i })

    await user.type(input, roomId)
    await user.click(joinButton)

    expect(mockNavigate).toHaveBeenCalledWith(`/room/${roomId}`)
  })

  it('shows error when joining with empty room ID', async () => {
    const user = userEvent.setup()

    render(<Home />)

    const joinButton = screen.getByRole('button', { name: /join room/i })
    await user.click(joinButton)

    await waitFor(() => {
      expect(screen.getByText(/room id cannot be empty/i)).toBeInTheDocument()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('allows joining created room', async () => {
    const user = userEvent.setup()
    const mockRoomId = 'created-room-123'

    vi.mocked(roomApi.createRoom).mockResolvedValue({ roomId: mockRoomId })

    render(<Home />)

    // Create room
    const createButton = screen.getByRole('button', { name: /create new room/i })
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText(mockRoomId)).toBeInTheDocument()
    })

    // Join the created room - use getAllByRole and select the secondary button
    const joinButtons = screen.getAllByRole('button', { name: /join room/i })
    const joinCreatedButton = joinButtons.find(btn => btn.className.includes('secondary'))
    expect(joinCreatedButton).toBeDefined()
    await user.click(joinCreatedButton!)

    expect(mockNavigate).toHaveBeenCalledWith(`/room/${mockRoomId}`)
  })

  it('allows joining room by pressing Enter key', async () => {
    const user = userEvent.setup()
    const roomId = 'enter-key-room'

    render(<Home />)

    const input = screen.getByPlaceholderText(/enter room id/i)
    await user.type(input, roomId)
    await user.keyboard('{Enter}')

    expect(mockNavigate).toHaveBeenCalledWith(`/room/${roomId}`)
  })
})
