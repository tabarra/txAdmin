// Required for the core webserver integration to work
import 'vite/modulepreload-polyfill'

import { ErrorBoundary } from "react-error-boundary";
import React from 'react'
import ReactDOM from 'react-dom/client'
import './globals.css'

import MockShell from './MockShell.tsx'
import { AppErrorFallback } from './components/ErrorFallback.tsx';

//If the initial routing is from WebPipe, remove it from the pathname so the router can handle it
if (window.location.pathname.substring(0, 8) === '/WebPipe') {
  console.info('Removing WebPipe prefix from the pathname.');
  const newUrl = window.location.pathname.substring(8) + window.location.search + window.location.hash;
  window.history.replaceState({}, '', newUrl);
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <MockShell />
    </ErrorBoundary>
  </React.StrictMode>,
)
