import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LoadingSpinner } from './components'
import './App.css'

// Lazy load route components for code splitting
const Home = lazy(() => import('./pages/Home'))
const Room = lazy(() => import('./pages/Room'))

const App: React.FC = () => {
  return (
    <Router>
      <Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
            }}
          >
            <LoadingSpinner />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App  
