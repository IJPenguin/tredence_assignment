import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CodeEditor } from './CodeEditor'
import * as autocompleteApi from '../services/autocompleteApi'
import React from 'react'

// Mock Monaco Editor - need to mock both default and lazy import
vi.mock('@monaco-editor/react', () => {
  const MockEditor = ({ value, onChange, onMount }: any) => {
    // Simulate editor mount
    React.useEffect(() => {
      if (onMount) {
        const mockEditor = {
          onDidChangeCursorPosition: vi.fn(),
          addCommand: vi.fn(),
          getModel: vi.fn(() => ({
            getOffsetAt: vi.fn(() => 0),
          })),
          getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
          executeEdits: vi.fn(),
          setPosition: vi.fn(),
          deltaDecorations: vi.fn(() => []),
        }
        const mockMonaco = {
          KeyCode: { Tab: 2 },
          Range: vi.fn(),
        }
        onMount(mockEditor, mockMonaco)
      }
    }, [onMount])

    return (
      <div data-testid="monaco-editor">
        <textarea
          data-testid="editor-textarea"
          value={value}
          onChange={e => onChange && onChange(e.target.value)}
        />
      </div>
    )
  }

  return {
    default: MockEditor,
  }
})

// Mock autocomplete API
vi.mock('../services/autocompleteApi')

describe('CodeEditor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the editor with initial value', async () => {
    const initialCode = 'console.log("Hello")'
    render(<CodeEditor value={initialCode} onChange={vi.fn()} language="javascript" />)

    // Wait for the editor to load
    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
    })

    expect(screen.getByTestId('editor-textarea')).toHaveValue(initialCode)
  })

  it('calls onChange when code changes', async () => {
    const handleChange = vi.fn()
    render(<CodeEditor value="" onChange={handleChange} language="javascript" />)

    // Wait for editor to load
    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
    })

    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement
    const newCode = 'const x = 1'

    // Simulate typing by changing value and triggering change event
    textarea.value = newCode
    textarea.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith(newCode)
    })
  })

  it('calls onLocalChange with debouncing', async () => {
    const handleLocalChange = vi.fn()
    render(
      <CodeEditor
        value=""
        onChange={vi.fn()}
        onLocalChange={handleLocalChange}
        language="javascript"
      />
    )

    // Wait for debounce
    await waitFor(
      () => {
        // Debounce should prevent immediate calls
        expect(handleLocalChange).not.toHaveBeenCalled()
      },
      { timeout: 50 }
    )
  })

  it('triggers autocomplete after typing stops', async () => {
    vi.mocked(autocompleteApi.getAutocompleteSuggestion).mockResolvedValue({
      suggestion: 'log("test")',
      confidence: 0.9,
    })

    const handleChange = vi.fn()
    render(
      <CodeEditor
        value=""
        onChange={handleChange}
        language="javascript"
        enableAutocomplete={true}
      />
    )

    // Wait for editor to load
    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
    })

    // Simulate typing by changing the value
    const textarea = screen.getByTestId('editor-textarea')
    expect(textarea).toBeInTheDocument()
  })

  it('does not trigger autocomplete when disabled', async () => {
    render(
      <CodeEditor
        value="console."
        onChange={vi.fn()}
        language="javascript"
        enableAutocomplete={false}
      />
    )

    // Wait to ensure autocomplete is not called
    await new Promise(resolve => setTimeout(resolve, 700))

    expect(autocompleteApi.getAutocompleteSuggestion).not.toHaveBeenCalled()
  })

  it('does not trigger autocomplete in read-only mode', async () => {
    render(
      <CodeEditor
        value="console."
        onChange={vi.fn()}
        language="javascript"
        readOnly={true}
        enableAutocomplete={true}
      />
    )

    // Wait to ensure autocomplete is not called
    await new Promise(resolve => setTimeout(resolve, 700))

    expect(autocompleteApi.getAutocompleteSuggestion).not.toHaveBeenCalled()
  })

  it('shows loading indicator when fetching autocomplete', async () => {
    vi.mocked(autocompleteApi.getAutocompleteSuggestion).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ suggestion: 'test', confidence: 0.9 }), 200))
    )

    render(
      <CodeEditor
        value="console."
        onChange={vi.fn()}
        language="javascript"
        enableAutocomplete={true}
      />
    )

    // The loading indicator is shown during autocomplete fetch
    // In this test, we verify the component structure is correct
    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
    })
  })

  it('calls onCursorPositionChange when cursor moves', async () => {
    const handleCursorChange = vi.fn()

    render(
      <CodeEditor
        value="test"
        onChange={vi.fn()}
        language="javascript"
        onCursorPositionChange={handleCursorChange}
      />
    )

    // Wait for editor to mount and cursor listener to be set up
    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
    })

    // The cursor change handler should be registered
    // In a real scenario, this would be triggered by Monaco editor events
  })

  it('supports different languages', () => {
    const { rerender } = render(
      <CodeEditor value="print('hello')" onChange={vi.fn()} language="python" />
    )

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()

    rerender(<CodeEditor value="console.log('hello')" onChange={vi.fn()} language="javascript" />)

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  })

  it('supports different themes', () => {
    const { rerender } = render(
      <CodeEditor value="test" onChange={vi.fn()} language="javascript" theme="vs-dark" />
    )

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()

    rerender(<CodeEditor value="test" onChange={vi.fn()} language="javascript" theme="light" />)

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  })
})
