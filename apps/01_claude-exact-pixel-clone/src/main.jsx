import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { settings, applySettings } from './lib/settings.js'

applySettings(settings.get())

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
