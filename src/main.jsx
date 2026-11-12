import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/style.css';
import './styles/features/finish-screen.css';
import './styles/brand.css';
import './styles/admin-premium.css';
createRoot(document.getElementById('root')).render(<App />);
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Registration already waits for load; defer its code until then too.
    // This keeps service-worker behavior while shrinking initial JavaScript.
    void import('./services/serviceWorkerRegistration.js')
      .then(({ registerAppServiceWorker }) => registerAppServiceWorker())
      .catch(() => null);
  });
}
