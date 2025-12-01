import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom } from '../services/roomApi'
import { validateRoomId } from '../utils/validation'
import { LoadingSpinner, ToastContainer } from '../components'
import { useToast } from '../hooks/useToast'
import './Home.css'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [createdRoomId, setCreatedRoomId] = useState<string>('')
  const [joinRoomId, setJoinRoomId] = useState<string>('')
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const { toasts, removeToast, showSuccess, showError } = useToast()

  const handleCreateRoom = useCallback(async () => {
    setIsCreating(true)
    setCreatedRoomId('')

    try {
      const response = await createRoom()
      setCreatedRoomId(response.roomId)
      showSuccess('Room created successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room'
      showError(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }, [showSuccess, showError])

  const handleJoinRoom = useCallback(() => {
    const roomId = joinRoomId.trim()

    // Validate room ID format
    const validation = validateRoomId(roomId)
    if (!validation.isValid) {
      showError(validation.error || 'Invalid room ID')
      return
    }

    navigate(`/room/${roomId}`)
  }, [joinRoomId, navigate, showError])

  const handleJoinCreatedRoom = useCallback(() => {
    if (createdRoomId) {
      navigate(`/room/${createdRoomId}`)
    }
  }, [createdRoomId, navigate])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleJoinRoom()
      }
    },
    [handleJoinRoom]
  )

  return (
    <div className="home-container">
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      <div className="home-content">
        <h1>Real-Time Pair Programming</h1>
        <p className="subtitle">Collaborate on code in real-time with instant synchronization</p>

        <div className="section">
          <h2>Create New Room</h2>
          <button onClick={handleCreateRoom} disabled={isCreating} className="primary-button">
            {isCreating ? (
              <>
                <LoadingSpinner size="small" />
                <span style={{ marginLeft: '0.5rem' }}>Creating...</span>
              </>
            ) : (
              'Create New Room'
            )}
          </button>

          {createdRoomId && (
            <div className="room-created">
              <div className="room-id-display">
                <span className="label">Room ID:</span>
                <code className="room-id">{createdRoomId}</code>
              </div>
              <button onClick={handleJoinCreatedRoom} className="secondary-button">
                Join Room
              </button>
            </div>
          )}
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="section">
          <h2>Join Existing Room</h2>
          <div className="join-room-form">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={joinRoomId}
              onChange={e => setJoinRoomId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="room-input"
            />
            <button onClick={handleJoinRoom} className="primary-button">
              Join Room
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
