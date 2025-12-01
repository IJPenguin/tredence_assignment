import { createSlice, PayloadAction } from '@reduxjs/toolkit'

/**
 * Room state interface
 */
export interface RoomState {
  roomId: string | null
  code: string
  isConnected: boolean
}

/**
 * Initial state for room slice
 */
const initialState: RoomState = {
  roomId: null,
  code: '',
  isConnected: false,
}

/**
 * Room slice for managing room state
 */
const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    /**
     * Set the current room ID
     */
    setRoomId: (state, action: PayloadAction<string | null>) => {
      state.roomId = action.payload
    },
    /**
     * Set the code content
     */
    setCode: (state, action: PayloadAction<string>) => {
      state.code = action.payload
    },
    /**
     * Set the WebSocket connection status
     */
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload
    },
  },
})

export const { setRoomId, setCode, setConnectionStatus } = roomSlice.actions
export default roomSlice.reducer
