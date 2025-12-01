/**
 * Editor-related types and interfaces
 */

/**
 * Represents the cursor position in the editor
 */
export interface CursorPosition {
  line: number
  column: number
  offset: number // Character offset from start of document
}

/**
 * Represents the state of the code editor
 */
export interface EditorState {
  code: string
  language: string
  cursorPosition: CursorPosition
  suggestion: string | null
  isLoadingSuggestion: boolean
}
