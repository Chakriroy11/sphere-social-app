import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
// Import the service worker registration
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// CHANGE THIS LINE to .register()
serviceWorkerRegistration.register();