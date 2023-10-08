// so the backend integration works
import 'vite/modulepreload-polyfill'

import React from 'react'
import ReactDOM from 'react-dom/client'
import './globals.css'

import { RouterProvider } from '@tanstack/react-router'
import { router } from './router.tsx'


// Register your router for maximum type safety
declare module '@tanstack/react-router' {
  interface Register {
      router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
