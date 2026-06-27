import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { Admin } from './ui/Admin';
import { startStateSync, useShow } from './store';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

// Routes share one SPA bundle (the server falls back to index.html):
//   /admin  → the admin UI for editing the script and driving the show.
//   /script → the printable parent guide ("Coco & die 4 Schlösser").
//   /       → the TV display app.
const path = window.location.pathname;
const isAdmin = path.startsWith('/admin');
const isScript = path.startsWith('/script');
const root = createRoot(container);

if (isScript) {
  // Lazy-load the guide so its bundle and parchment styles never reach the TV
  // display or the admin UI.
  void import('./script/ScriptPage').then(({ default: ScriptPage }) => {
    root.render(
      <React.StrictMode>
        <ScriptPage />
      </React.StrictMode>
    );
  });
} else {
  if (!isAdmin) {
    // Fetch the show state from the server as soon as the app loads, then keep
    // it live over SSE so admin edits/show changes arrive without a reload.
    void useShow.getState().loadState();
    startStateSync();
  }

  root.render(<React.StrictMode>{isAdmin ? <Admin /> : <App />}</React.StrictMode>);
}
