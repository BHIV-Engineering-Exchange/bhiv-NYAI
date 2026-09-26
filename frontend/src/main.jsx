import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Safely hide loading overlay when React app is ready
function hideLoadingOverlay() {
  const loadingOverlay = document.getElementById('loading-overlay')
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden')
  }
}

if (document.readyState === 'complete') {
  hideLoadingOverlay()
} else {
  window.addEventListener('load', hideLoadingOverlay)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)