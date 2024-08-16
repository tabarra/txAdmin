import { ErrorBoundary } from "react-error-boundary";
import { Route as WouterRoute, Switch } from "wouter";
import { PageErrorFallback } from "@/components/ErrorFallback";
import { useAtomValue, useSetAtom } from "jotai";
import { contentRefreshKeyAtom, pageErrorStatusAtom, useSetPageTitle } from "@/hooks/pages";
import { navigate as setLocation } from 'wouter/use-location';

import Iframe from "@/pages/Iframe";
import NotFound from "@/pages/NotFound";
import TestingPage from "@/pages/TestingPage/TestingPage";
import LiveConsolePage from "@/pages/LiveConsole/LiveConsolePage";
import PlayersPage from "@/pages/Players/PlayersPage";
import HistoryPage from "@/pages/History/HistoryPage";
import BanTemplatesPage from "@/pages/BanTemplates/BanTemplatesPage";
import SystemLogPage from "@/pages/SystemLogPage";
import AddLegacyBanPage from "@/pages/AddLegacyBanPage";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import PlayerCrashesPage from "@/pages/PlayerCrashesPage";


type RouteType = {
    path: string;
    title: string;
    children: JSX.Element;
};

const allRoutes: RouteType[] = [
    //Global Routes
    {
        path: '/players',
        title: 'Players',
        children: <PlayersPage />
    },
    {
        path: '/history',
        title: 'History',
        children: <HistoryPage />
    },
    {
        path: '/whitelist',
        title: 'Whitelist',
        children: <Iframe legacyUrl="whitelist" />
    },
    {
        path: '/admins',
        title: 'Admins',
        children: <Iframe legacyUrl="adminManager" />
    },
    {
        path: '/settings',
        title: 'Settings',
        children: <Iframe legacyUrl="settings" />
    },
    {
        path: '/system/master-actions',
        title: 'Master Actions',
        children: <Iframe legacyUrl="masterActions" />
    },
    {
        path: '/system/diagnostics',
        title: 'Diagnostics',
        children: <Iframe legacyUrl="diagnostics" />
    },
    {
        path: '/system/console-log',
        title: 'Console Log',
        children: <SystemLogPage pageName="console" />
    },
    {
        path: '/system/action-log',
        title: 'Action Log',
        children: <SystemLogPage pageName="action" />
    },

    //Server Routes
    {
        path: '/',
        title: 'Dashboard',
        children: <DashboardPage />
    },
    {
        path: '/server/console',
        title: 'Live Console',
        children: <LiveConsolePage />
    },
    {
        path: '/server/resources',
        title: 'Resources',
        children: <Iframe legacyUrl="resources" />
    },
    {
        path: '/server/server-log',
        title: 'Server Log',
        children: <Iframe legacyUrl="serverLog" />
    },
    {
        path: '/server/cfg-editor',
        title: 'CFG Editor',
        children: <Iframe legacyUrl="cfgEditor" />
    },
    {
        path: '/server/setup',
        title: 'Server Setup',
        children: <Iframe legacyUrl="setup" />
    },
    {
        path: '/server/deployer',
        title: 'Server Deployer',
        children: <Iframe legacyUrl="deployer" />
    },
    {
        path: '/advanced',
        title: 'Advanced',
        children: <Iframe legacyUrl="advanced" />
    },

    //No nav routes
    {
        path: '/settings/ban-templates',
        title: 'Ban Templates',
        children: <BanTemplatesPage />
    },
    {
        path: '/ban-identifiers',
        title: 'Ban Identifiers',
        children: <AddLegacyBanPage />
    },
    {
        path: '/player-crashes',
        title: 'Player Crashes',
        children: <PlayerCrashesPage />
    },
];


function Route(props: RouteType) {
    const setPageTitle = useSetPageTitle();
    setPageTitle(props.title);
    return <WouterRoute path={props.path}>{props.children}</WouterRoute>
}


export default function MainRouter() {
    const setPageErrorStatus = useSetAtom(pageErrorStatusAtom);
    const contentRefreshKey = useAtomValue(contentRefreshKeyAtom);

    return (
        <ErrorBoundary
            key={contentRefreshKey}
            FallbackComponent={PageErrorFallback}
            onError={() => {
                console.log('Page ErrorBoundary caught an error');
                setPageErrorStatus(true);
            }}
            onReset={() => {
                console.log('Page ErrorBoundary reset');
                setLocation('/');
                setPageErrorStatus(false);
            }}
        >
            <Switch>
                {allRoutes.map((route) => (
                    <Route key={route.path} path={route.path} title={route.title}>
                        {route.children}
                    </Route>
                ))}

                {/* Other Routes - they need to set the title manuually */}
                {import.meta.env.DEV && (
                    <WouterRoute path="/test"><TestingPage /></WouterRoute>
                )}
                <WouterRoute path="/:fullPath*" component={NotFound} />
            </Switch>
        </ErrorBoundary>
    );
}
