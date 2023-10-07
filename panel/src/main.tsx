// so the backend integration works
import 'vite/modulepreload-polyfill'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import {
  Outlet,
  RouterProvider,
  Link,
  Router,
  Route,
  RootRoute,
} from '@tanstack/react-router'

// import { TanStackRouterDevtools } from '@tanstack/router-devtools';



function Root() {
  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        width: '300px',
      }}>
        <Link to="/">Home</Link>
        <Link to="/iframe">iframe</Link>
      </div>
      <hr />
      <Outlet />
    </>
  )
}

function IframePage() {
  return (
    <div style={{width: '100%', height: '900px'}}>
      <iframe src="./resources" style={{width: '100%', height: '100%'}}></iframe>
    </div>
  )
}





// Create a root route
const rootRoute = new RootRoute({
  component: Root,
})

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: App,
})

const iframeRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/iframe',
  component: IframePage,
})



// Create the route tree using your routes
const routeTree = rootRoute.addChildren([indexRoute, iframeRoute])

// Create the router using your route tree
const router = new Router({ routeTree })

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
