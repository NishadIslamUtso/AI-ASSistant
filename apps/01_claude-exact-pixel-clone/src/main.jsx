import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { applySettings, loadSettings } from './lib/settings.js'
import './index.css'

// Apply the saved theme before the first paint so a light theme does not flash dark.
applySettings(loadSettings())
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
