import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { Admin } from './ui/Admin';
import { startStateSync, useShow } from './store';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

// Two routes share one SPA bundle (the server falls back to index.html):
//   /admin  → the admin UI for editing the script and driving the show.
//   /       → the TV display app.
const isAdmin = window.location.pathname.startsWith('/admin');

if (!isAdmin) {
  // Fetch the show state from the server as soon as the app loads, then keep it
  // live over SSE so admin edits/show changes arrive without a reload.
  void useShow.getState().loadState();
  startStateSync();
}

createRoot(container).render(
  <React.StrictMode>{isAdmin ? <Admin /> : <App />}</React.StrictMode>
);
