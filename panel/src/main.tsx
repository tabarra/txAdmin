// Required for the core webserver integration to work
import 'vite/modulepreload-polyfill'

import { ErrorBoundary } from "react-error-boundary";
import React from 'react'
import ReactDOM from 'react-dom/client'
import './globals.css'

import MockShell from './MockShell.tsx'
import { AppErrorFallback } from './components/ErrorFallback.tsx';
import { useIsAuthenticated } from './hooks/auth.ts';
import AuthShell from './AuthShell.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isValidRedirectPath } from './lib/utils.ts';

//If the initial routing is from WebPipe, remove it from the pathname so the router can handle it
if (window.location.pathname.substring(0, 8) === '/WebPipe') {
    console.info('Removing WebPipe prefix from the pathname.');
    const newUrl = window.location.pathname.substring(8) + window.location.search + window.location.hash;
    window.history.replaceState(null, '', newUrl);
}

//Rendering auth or main pages depending on if the user is authenticated
const authRoutePrefixes = ['/login', '/addMaster'];
const isAuthRoute = (pathname: string) => {
    return authRoutePrefixes.some(prefix => pathname.startsWith(prefix));
}

export function AuthContextSwitch() {
    const isAuthenticated = useIsAuthenticated();

    if (isAuthenticated) {
        //Replace the current URL with the redirect path if it exists and is valid
        const urlParams = new URLSearchParams(window.location.search);
        const redirectPath = urlParams.get('r');
        if (redirectPath) {
            if (isValidRedirectPath(redirectPath)) {
                window.history.replaceState(null, '', redirectPath as string);
            } else {
                window.history.replaceState(null, '', '/');
            }
        } else if (isAuthRoute(window.location.pathname)) {
            window.history.replaceState(null, '', '/');
        }

        return <MockShell />;
    } else {
        //Unless the user is already in the auth pages, redirect to the login page
        console.log('User is not authenticated. Redirecting to login page.');
        if (!window.txConsts.hasMasterAccount && !window.location.pathname.startsWith('/addMaster')) {
            console.log(window.location.pathname);
            window.history.replaceState(null, '', '/addMaster/pin');
        } else if (!isAuthRoute(window.location.pathname)) {
            const suffix = window.location.pathname + window.location.search + window.location.hash;
            const newSuffix = suffix === '/'
                ? `/login`
                : `/login?r=${encodeURIComponent(suffix)}`;
            window.history.replaceState(null, '', newSuffix);
        }

        return <AuthShell />;
    }
}

//Creating a global query client
const queryClient = new QueryClient()


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary FallbackComponent={AppErrorFallback}>
            <QueryClientProvider client={queryClient}>
                <AuthContextSwitch />
            </QueryClientProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
