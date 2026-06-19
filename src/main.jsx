import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { AuthProvider } from '@/context/AuthContext'
import { initSentry } from '@/lib/sentry'
import App from './App'
import './index.css'

initSentry()

function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="max-w-sm w-full card p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-bold text-navy mb-2">Something went wrong</h2>
        <p className="text-sm text-navy-300 mb-6">
          The error has been logged. Try reloading — if it keeps happening, let us know.
        </p>
        <button onClick={() => window.location.reload()} className="btn-primary w-full">
          Reload
        </button>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
)
