import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/style.css';
import './styles/features/finish-screen.css';
import './styles/brand.css';
import { registerAppServiceWorker } from './services/serviceWorkerRegistration.js';
createRoot(document.getElementById('root')).render(<App />);
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void registerAppServiceWorker();
  });
}
