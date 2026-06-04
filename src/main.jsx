import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App, { PublicLoyaltyPage } from './App.jsx'

const path = window.location.pathname;
const loyaltyMatch = path.match(/^\/(c|g|join)\/(.+)$/);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {loyaltyMatch
      ? <PublicLoyaltyPage type={loyaltyMatch[1]} param={loyaltyMatch[2]}/>
      : <App />}
  </StrictMode>,
)
