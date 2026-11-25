import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../theme/app.css';
import './popup.css';
import { ToastProvider } from '../components/ui';
import { Popup } from './Popup';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <Popup />
    </ToastProvider>
  </StrictMode>,
);
