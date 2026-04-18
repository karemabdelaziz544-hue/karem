import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
 
const rootElement = document.getElementById('root');

// This check is crucial for Vite's HMR to prevent re-creating the root on every update.
if (rootElement && !rootElement.hasChildNodes()) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}