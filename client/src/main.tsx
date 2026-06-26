import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { precacheSpeech } from './precache';
import './styles.css';

// Warm the server-side TTS cache for every line as soon as the app loads, so the
// live show isn't held up by ElevenLabs latency the first time a line plays.
precacheSpeech();

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
