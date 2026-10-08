import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/variables.css'
import './styles/global.css'
import App from './App.jsx'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found. Ensure the #root element exists in index.html.')
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
