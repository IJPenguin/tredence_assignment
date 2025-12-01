import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CursorPosition } from '../types/editor'

/**
 * Editor state interface
 */
export interface EditorState {
  cursorPosition: CursorPosition
  language: string
  suggestion: string | null
}

/**
 * Initial state for editor slice
 */
const initialState: EditorState = {
  cursorPosition: {
    line: 1,
    column: 1,
    offset: 0,
  },
  language: 'python',
  suggestion: null,
}

/**
 * Editor slice for managing editor state
 */
const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    /**
     * Set the cursor position
     */
    setCursorPosition: (state, action: PayloadAction<CursorPosition>) => {
      state.cursorPosition = action.payload
    },
    /**
     * Set the programming language
     */
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload
    },
    /**
     * Set the autocomplete suggestion
     */
    setSuggestion: (state, action: PayloadAction<string>) => {
      state.suggestion = action.payload
    },
    /**
     * Clear the autocomplete suggestion
     */
    clearSuggestion: state => {
      state.suggestion = null
    },
  },
})

export const { setCursorPosition, setLanguage, setSuggestion, clearSuggestion } =
  editorSlice.actions
export default editorSlice.reducer
