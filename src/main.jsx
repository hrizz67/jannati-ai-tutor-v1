import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/style.css';
import './styles/brand.css';
createRoot(document.getElementById('root')).render(<App />);
if (import.meta.env.PROD && 'serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js?v=19`).catch(()=>{}));
