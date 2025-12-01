import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore, PreloadedState } from '@reduxjs/toolkit'
import { RootState, store as appStore } from '@/store'
import roomReducer from '@/store/roomSlice'
import editorReducer from '@/store/editorSlice'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState<RootState>
  store?: typeof appStore
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        room: roomReducer,
        editor: editorReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    )
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { renderWithProviders as render }
