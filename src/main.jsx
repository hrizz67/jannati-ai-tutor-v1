import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/style.css';
createRoot(document.getElementById('root')).render(<App />);
if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/jannati-ai-tutor-v1/service-worker.js').catch(()=>{}));
