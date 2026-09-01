import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// Suppress benign Vite dev server HMR websocket connection errors in the sandbox environment
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason);
    if (
      msg.includes('WebSocket') ||
      msg.includes('closed without opened') ||
      msg.includes('vite') ||
      (reason?.stack && reason.stack.includes('vite'))
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.debug('[HMR Bypass] Ignored expected Vite HMR disconnection:', msg);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('WebSocket') ||
      msg.includes('closed without opened') ||
      msg.includes('vite')
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.debug('[HMR Bypass] Ignored expected Vite error event:', msg);
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>,
);
