import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import roomReducer from './roomSlice'
import editorReducer from './editorSlice'

/**
 * Configure Redux store with room and editor slices
 */
export const store = configureStore({
  reducer: {
    room: roomReducer,
    editor: editorReducer,
  },
})

/**
 * Infer the `RootState` type from the store itself
 */
export type RootState = ReturnType<typeof store.getState>

/**
 * Infer the `AppDispatch` type from the store itself
 */
export type AppDispatch = typeof store.dispatch

/**
 * Typed hook for useDispatch
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()

/**
 * Typed hook for useSelector
 */
export const useAppSelector = useSelector.withTypes<RootState>()
