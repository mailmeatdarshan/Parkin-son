import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { CryptoProvider } from './context/CryptoContext.jsx';
import { CalendarNotificationProvider } from './context/CalendarNotificationProvider.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "placeholder-client-id"}>
        <CryptoProvider>
          <SettingsProvider>
            <CalendarNotificationProvider>
              <App />
            </CalendarNotificationProvider>
          </SettingsProvider>
        </CryptoProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
