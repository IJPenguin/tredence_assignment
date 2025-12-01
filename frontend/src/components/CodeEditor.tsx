/**
 * CodeEditor component
 * Wraps Monaco Editor with real-time collaboration and autocomplete features
 *
 * @example
 * ```tsx
 * import { CodeEditor } from '../components/CodeEditor'
 * import { useAppDispatch, useAppSelector } from '../store'
 * import { setCode, setCursorPosition } from '../store/editorSlice'
 * import { websocketService } from '../services/websocketService'
 *
 * function MyEditor() {
 *   const dispatch = useAppDispatch()
 *   const { code } = useAppSelector(state => state.room)
 *   const { language } = useAppSelector(state => state.editor)
 *
 *   const handleCodeChange = (newCode: string) => {
 *     dispatch(setCode(newCode))
 *   }
 *
 *   const handleLocalChange = (newCode: string) => {
 *     // Send to WebSocket (debounced)
 *     websocketService.sendCodeUpdate(newCode, Date.now())
 *   }
 *
 *   const handleCursorChange = (offset: number, line: number, column: number) => {
 *     dispatch(setCursorPosition({ offset, line, column }))
 *   }
 *
 *   return (
 *     <CodeEditor
 *       value={code}
 *       onChange={handleCodeChange}
 *       onLocalChange={handleLocalChange}
 *       onCursorPositionChange={handleCursorChange}
 *       language={language}
 *       enableAutocomplete={true}
 *     />
 *   )
 * }
 * ```
 */

import { useRef, useEffect, useCallback, useState, lazy, Suspense } from 'react'
import { OnMount, Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { CONFIG } from '../utils/constants'
import { getAutocompleteSuggestion } from '../services/autocompleteApi'

// Lazy load Monaco Editor for better initial load performance
const Editor = lazy(() => import('@monaco-editor/react'))

/**
 * Props for CodeEditor component
 */
export interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  readOnly?: boolean
  theme?: 'vs-dark' | 'light'
  onCursorPositionChange?: (offset: number, line: number, column: number) => void
  onMount?: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void
  onLocalChange?: (value: string) => void // Called when user types (debounced)
  enableAutocomplete?: boolean
}

/**
 * CodeEditor component using Monaco Editor
 */
export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  theme = 'vs-dark',
  onCursorPositionChange,
  onMount: onMountProp,
  onLocalChange,
  enableAutocomplete = true,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const debounceTimerRef = useRef<number | null>(null)
  const autocompleteTimerRef = useRef<number | null>(null)
  const isRemoteChangeRef = useRef(false)
  const lastValueRef = useRef(value)
  const decorationsRef = useRef<string[]>([])
  const currentCursorOffsetRef = useRef(0)
  const [currentSuggestion, setCurrentSuggestion] = useState<string | null>(null)
  const suggestionInsertedRef = useRef(false)
  const [isLoadingAutocomplete, setIsLoadingAutocomplete] = useState(false)

  /**
   * Clear autocomplete suggestion
   */
  const clearSuggestion = useCallback(() => {
    if (editorRef.current && decorationsRef.current.length > 0) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [])
    }
    setCurrentSuggestion(null)
    suggestionInsertedRef.current = false
  }, [])

  /**
   * Display autocomplete suggestion as inline decoration (GitHub Copilot style)
   */
  const displaySuggestion = useCallback((suggestion: string, offset: number) => {
    console.log('displaySuggestion called with:', { suggestion, offset })

    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) {
      console.log('Editor or Monaco not available')
      return
    }

    const model = editor.getModel()
    if (!model) {
      console.log('Model not available')
      return
    }

    const position = model.getPositionAt(offset)
    console.log('Position:', position)

    // Split suggestion into lines for multi-line support
    const suggestionLines = suggestion.split('\n')
    console.log('Suggestion lines:', suggestionLines)
    const decorations: editor.IModelDeltaDecoration[] = []

    // First line - show inline after cursor
    if (suggestionLines.length > 0 && suggestionLines[0]) {
      decorations.push({
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        ),
        options: {
          after: {
            content: suggestionLines[0],
            inlineClassName: 'ghost-text',
          },
          showIfCollapsed: true,
        },
      })
      console.log('Added first line decoration:', suggestionLines[0])
    }

    // Additional lines - show as whole line decorations
    for (let i = 1; i < suggestionLines.length; i++) {
      const line = suggestionLines[i]
      if (line !== undefined) {
        decorations.push({
          range: new monaco.Range(position.lineNumber + i, 1, position.lineNumber + i, 1),
          options: {
            before: {
              content: line,
              inlineClassName: 'ghost-text',
            },
            showIfCollapsed: true,
          },
        })
        console.log('Added additional line decoration:', line)
      }
    }

    console.log('Total decorations:', decorations.length)
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations)
    console.log('Decorations applied:', decorationsRef.current)
    setCurrentSuggestion(suggestion)
  }, [])

  /**
   * Fetch autocomplete suggestion
   */
  const fetchAutocompleteSuggestion = useCallback(
    async (code: string, offset: number, lang: string) => {
      if (!enableAutocomplete) return

      setIsLoadingAutocomplete(true)
      try {
        const response = await getAutocompleteSuggestion(code, offset, lang)
        console.log('Autocomplete response:', response)
        console.log(
          'Request offset:',
          offset,
          'Current cursor offset:',
          currentCursorOffsetRef.current
        )

        // Display suggestion if it's not empty
        // Use the current cursor position instead of checking if it matches request offset
        if (response.suggestion && response.suggestion.trim()) {
          console.log('Displaying suggestion at current cursor position')
          displaySuggestion(response.suggestion, currentCursorOffsetRef.current)
        } else {
          console.log('Not displaying suggestion - empty or invalid')
        }
      } catch (error) {
        console.error('Failed to fetch autocomplete suggestion:', error)
        // Silently fail - don't show error to user for autocomplete
      } finally {
        setIsLoadingAutocomplete(false)
      }
    },
    [enableAutocomplete, displaySuggestion]
  )

  /**
   * Trigger autocomplete with debouncing
   */
  const triggerAutocomplete = useCallback(
    (code: string, offset: number, lang: string) => {
      // Clear existing timer
      if (autocompleteTimerRef.current !== null) {
        clearTimeout(autocompleteTimerRef.current)
      }

      // Clear existing suggestion
      clearSuggestion()

      // Set up debounced autocomplete fetch
      autocompleteTimerRef.current = window.setTimeout(() => {
        fetchAutocompleteSuggestion(code, offset, lang)
      }, CONFIG.AUTOCOMPLETE_DEBOUNCE_MS)
    },
    [fetchAutocompleteSuggestion, clearSuggestion]
  )

  /**
   * Accept current suggestion (insert into editor)
   */
  const acceptSuggestion = useCallback(() => {
    const editor = editorRef.current
    if (!editor || !currentSuggestion) return

    const position = editor.getPosition()
    if (!position) return

    // Insert suggestion at cursor position
    editor.executeEdits('autocomplete', [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        text: currentSuggestion,
      },
    ])

    // Move cursor to end of inserted text
    const newColumn = position.column + currentSuggestion.length
    editor.setPosition({
      lineNumber: position.lineNumber,
      column: newColumn,
    })

    // Mark that suggestion was inserted to prevent re-triggering
    suggestionInsertedRef.current = true

    // Clear the suggestion
    clearSuggestion()
  }, [currentSuggestion, clearSuggestion])

  /**
   * Handle editor mount
   */
  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor
      monacoRef.current = monaco

      // Set up cursor position tracking
      editor.onDidChangeCursorPosition(e => {
        const model = editor.getModel()
        if (model) {
          const offset = model.getOffsetAt(e.position)
          currentCursorOffsetRef.current = offset

          if (onCursorPositionChange) {
            onCursorPositionChange(offset, e.position.lineNumber, e.position.column)
          }

          // Clear suggestion when cursor moves (unless we just inserted it)
          if (currentSuggestion && !suggestionInsertedRef.current) {
            clearSuggestion()
          }
          suggestionInsertedRef.current = false
        }
      })

      // Add keyboard shortcut for accepting suggestion (Tab key)
      editor.addCommand(monaco.KeyCode.Tab, () => {
        if (currentSuggestion) {
          acceptSuggestion()
        } else {
          // Default tab behavior
          editor.trigger('keyboard', 'type', { text: '\t' })
        }
      })

      // Add CSS for GitHub Copilot-style ghost text
      const style = document.createElement('style')
      style.textContent = `
        .ghost-text {
          color: #6b7280 !important;
          opacity: 0.5 !important;
          font-style: normal !important;
        }
        .autocomplete-suggestion {
          color: #6b7280 !important;
          opacity: 0.5 !important;
          font-style: normal !important;
        }
      `
      document.head.appendChild(style)

      // Call external onMount handler if provided
      if (onMountProp) {
        onMountProp(editor, monaco)
      }
    },
    [onCursorPositionChange, onMountProp, currentSuggestion, acceptSuggestion, clearSuggestion]
  )

  /**
   * Handle editor value change with debouncing
   */
  const handleEditorChange = useCallback(
    (newValue: string | undefined) => {
      if (newValue === undefined) return

      // Always call onChange immediately to update Redux store
      onChange(newValue)

      // If this is a remote change, don't trigger local change handler or autocomplete
      if (isRemoteChangeRef.current) {
        isRemoteChangeRef.current = false
        lastValueRef.current = newValue
        return
      }

      // Clear existing debounce timer
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
      }

      // Set up debounced local change handler (for WebSocket updates)
      if (onLocalChange) {
        debounceTimerRef.current = window.setTimeout(() => {
          onLocalChange(newValue)
          lastValueRef.current = newValue
        }, CONFIG.CODE_UPDATE_DEBOUNCE_MS)
      }

      // Trigger autocomplete for local changes
      if (enableAutocomplete && !readOnly) {
        const offset = currentCursorOffsetRef.current
        triggerAutocomplete(newValue, offset, language)
      }
    },
    [onChange, onLocalChange, enableAutocomplete, readOnly, language, triggerAutocomplete]
  )

  /**
   * Update editor value from external source (remote changes)
   * This prevents echo by marking the change as remote
   */
  useEffect(() => {
    // Only update if value changed and it's different from last local value
    if (value !== lastValueRef.current) {
      isRemoteChangeRef.current = true
      lastValueRef.current = value
    }
  }, [value])

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
      }
      if (autocompleteTimerRef.current !== null) {
        clearTimeout(autocompleteTimerRef.current)
      }
      clearSuggestion()
      editorRef.current = null
      monacoRef.current = null
    }
  }, [clearSuggestion])

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              backgroundColor: '#1e1e1e',
              color: '#fff',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 1rem',
                }}
              />
              <div>Loading editor...</div>
            </div>
          </div>
        }
      >
        <Editor
          height="100%"
          language={language}
          value={value}
          theme={theme}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            readOnly,
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            quickSuggestions: false, // Disable built-in suggestions
            suggestOnTriggerCharacters: false,
          }}
        />
      </Suspense>
      {isLoadingAutocomplete && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            padding: '4px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              width: '12px',
              height: '12px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span>Loading suggestion...</span>
        </div>
      )}
    </div>
  )
}

// Export helper functions for accessing editor instance
export { type editor, type Monaco }
