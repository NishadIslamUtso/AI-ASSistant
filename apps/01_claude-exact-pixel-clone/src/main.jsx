import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
if (!localStorage.getItem('selected_provider')) localStorage.setItem('selected_provider','ollama')
if (!localStorage.getItem('selected_model')) localStorage.setItem('selected_model','qwen2.5:3b')
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
