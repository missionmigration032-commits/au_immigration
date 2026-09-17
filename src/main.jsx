import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
const path = window.location.pathname;
if (!path.startsWith('/evo/firstParty') && !path.startsWith('/lusc/login')) {
  import('./index.css');
}
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
