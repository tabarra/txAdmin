import { ErrorBoundary } from "react-error-boundary";
import { Route, Switch, useLocation } from "wouter";
import { PageErrorFallback } from "../components/ErrorFallback";
import { useAtomValue, useSetAtom } from "jotai";
import { contentRefreshKeyAtom, pageErrorStatusAtom } from "../hooks/mainPageStatus";

import Iframe from "../pages/Iframe"
import NotFound from "../pages/NotFound"
import TestingPage from "../pages/testing/TestingPage";


export default function MainRouter() {
    const setPageErrorStatus = useSetAtom(pageErrorStatusAtom);
    const contentRefreshKey = useAtomValue(contentRefreshKeyAtom);
    const setLocation = useLocation()[1];

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
                {/* Global Routes */}
                <Route path="/players"><Iframe legacyUrl="players" /></Route>
                {/* TODO: history */}
                <Route path="/whitelist"><Iframe legacyUrl="whitelist" /></Route>
                <Route path="/admins"><Iframe legacyUrl="adminManager" /></Route>
                <Route path="/settings"><Iframe legacyUrl="settings" /></Route>
                <Route path="/system/master-actions"><Iframe legacyUrl="masterActions" /></Route>
                <Route path="/system/diagnostics"><Iframe legacyUrl="diagnostics" /></Route>
                <Route path="/system/console-log"><Iframe legacyUrl="systemLog#nav-console" /></Route>
                <Route path="/system/action-log"><Iframe legacyUrl="systemLog#nav-actions" /></Route>

                {/* Server Routes */}
                <Route path="/"><Iframe legacyUrl="dashboard" /></Route>
                <Route path="/server/console"><Iframe legacyUrl="console" /></Route>
                <Route path="/server/resources"><Iframe legacyUrl="resources" /></Route>
                <Route path="/server/server-log"><Iframe legacyUrl="serverLog" /></Route>
                <Route path="/server/cfg-editor"><Iframe legacyUrl="cfgEditor" /></Route>
                <Route path="/advanced"><Iframe legacyUrl="advanced" /></Route>

                {/* Other Routes */}
                <Route path="/test"><TestingPage /></Route>
                <Route path="/:fullPath*" component={NotFound} />
            </Switch>
        </ErrorBoundary>
    );
}
