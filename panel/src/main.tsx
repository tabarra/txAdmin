// Required for the core webserver integration to work
import 'vite/modulepreload-polyfill'

import React from 'react'
import ReactDOM from 'react-dom/client'
import './globals.css'

import MockShell from './MockShell.tsx'



ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MockShell/>
  </React.StrictMode>,
)
