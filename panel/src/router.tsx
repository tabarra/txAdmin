import { RootRoute, Route, Router, useParams } from "@tanstack/react-router"
import MockShell from "./MockShell"
import Dashboard from "./pages/Dashboard"
import GlobalSettings from "./pages/GlobalSettings"
import ServerConfig from "./pages/ServerConfig"
import Iframe from "./pages/Iframe"
import NotFound from "./pages/NotFound"


// Create a root route
const rootRoute = new RootRoute({
    component: MockShell,
})


/**
 * Global Routes
 */
const dashboardRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Dashboard,
})
const playersRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/players',
    component: () => <Iframe legacyUrl="players" />,
})
const whitelistRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/whitelist',
    component: () => <Iframe legacyUrl="whitelist" />,
})
const adminsRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/admins',
    component: () => <Iframe legacyUrl="adminManager" />,
})
const systemDiagnosticsRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/system/diagnostics',
    component: () => <Iframe legacyUrl="diagnostics" />,
})
const systemConsoleLogRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/system/console-log',
    component: () => <Iframe legacyUrl="systemLog#nav-console" />,
})
const systemActionLogRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/system/action-log',
    component: () => <Iframe legacyUrl="systemLog#nav-actions" />,
})
const globalSettingsRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: GlobalSettings,
})


/**
 * Legacy Routes
 */
const consoleRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/server/console',
    component: () => <Iframe legacyUrl="console" />,
})
const resourcesRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/resources',
    component: () => <Iframe legacyUrl="resources" />,
})
const serverLogRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/server/server-log',
    component: () => <Iframe legacyUrl="serverLog" />,
})
const cfgEditorRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/server/cfg-editor',
    component: () => <Iframe legacyUrl="cfgEditor" />,
})
const serverConfigRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/server/config',
    component: ServerConfig,
})


/**
 * Other Routes
 */
const nuiStartRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/WebPipe/nui/start/$page',
    component: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const params = useParams({ from: nuiStartRoute.id });
        const legacyRoute = params.page === 'adminManager' ? 'adminManager' : 'serverLog';
        return <Iframe legacyUrl={legacyRoute} />
    },
})
const notFoundRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/*',
    component: () => {
        // const params = useParams({ from: notFoundRoute.id });
        return <NotFound />
    },
})


// Create the route tree using your routes
const routeTree = rootRoute.addChildren([
    //Global Routes
    dashboardRoute,
    playersRoute,
    whitelistRoute,
    adminsRoute,
    globalSettingsRoute,
    systemDiagnosticsRoute,
    systemConsoleLogRoute,
    systemActionLogRoute,

    //Server Routes
    consoleRoute,
    resourcesRoute,
    serverLogRoute,
    cfgEditorRoute,
    serverConfigRoute,

    //Other
    notFoundRoute,
    nuiStartRoute,
])

// Create the router using your route tree
export const router = new Router({ routeTree })
