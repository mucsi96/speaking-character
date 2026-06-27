import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useShow } from './store';
import './styles.css';

// Fetch the show script from the server as soon as the app loads. The server
// owns the script and pre-renders all of its TTS on startup, so the live show
// runs without ElevenLabs latency.
void useShow.getState().loadScript();

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
