// Required for the core webserver integration to work
import 'vite/modulepreload-polyfill'

import { ErrorBoundary } from "react-error-boundary";
import React from 'react'
import ReactDOM from 'react-dom/client'
import './globals.css'

import MockShell from './MockShell.tsx'
import { AppErrorFallback } from './components/ErrorFallback.tsx';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <MockShell />
    </ErrorBoundary>
  </React.StrictMode>,
)
