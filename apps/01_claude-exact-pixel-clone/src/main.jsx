import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

/**
 * Fresh installs get a dark, Claude-exact window.
 * No provider/model keys are written here any more — SettingsContext owns all
 * of that, including the legacy `claude_exact_settings` key so an older
 * install keeps its preferences.
 */
document.documentElement.setAttribute('data-theme', 'dark')
document.documentElement.style.background = '#1a1a1a'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
