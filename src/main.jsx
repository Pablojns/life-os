import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './themes/skyrim/tokens.css'
import './themes/skyrim/animations.css'
import './themes/clean/tokens.css'
import './themes/clean/animations.css'
import './themes/naruto/tokens.css'
import './themes/naruto/animations.css'
import './themes/solo/tokens.css'
import './themes/solo/animations.css'
import './themes/cyberpunk/tokens.css'
import './themes/ghibli/tokens.css'
import './themes/legendary/tokens.css'
import './styles/globals.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
