import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../theme/app.css';
import './dashboard.css';
import { ToastProvider } from '../components/ui';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
