import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './core/styles/global.css'

// Inicializar tema visual guardado antes de renderizar
try {
  const rawSettings = localStorage.getItem('appes_erp_global_settings_v2')
  if (rawSettings) {
    const parsed = JSON.parse(rawSettings)
    if (parsed.temaVisual === 'oscuro') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else if (parsed.temaVisual === 'auto') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) document.documentElement.setAttribute('data-theme', 'dark')
    }
  }
} catch (_) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
