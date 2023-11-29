import { useEventListener } from 'usehooks-ts';
import MainRouter from "./MainRouter";
import { useExpireAuthData } from '../hooks/auth';
import { Header } from './Header';
import { ServerSidebar } from './serverSidebar/ServerSidebar';
import { PlayersSidebar } from './PlayersSidebar';
import MainSheets from './MainSheets';
import WarningBar from './WarningBar';
import BreakpointDebugger from '@/components/BreakpointDebugger';
import { useEffect, useRef } from 'react';
import { useSetGlobalStatus } from '@/hooks/status';
import { useProcessUpdateAvailableEvent, useSetOfflineWarning } from '@/hooks/useWarningBar';
import { pageTitleWatcher } from '@/hooks/pages';
import { useAtomValue } from 'jotai';
import { getSocket } from '@/lib/utils';
import { useProcessPlayerlistEvents } from '@/hooks/playerlist';



export default function MainShell() {
    useAtomValue(pageTitleWatcher);
    const expireSession = useExpireAuthData();
    useEventListener('message', (e: MessageEventFromIframe) => {
        if (e.data.type === 'logoutNotice') {
            expireSession('child iframe');
        }
    });

    const socketStateChangeCounter = useRef(0);
    const setIsSocketOffline = useSetOfflineWarning();
    const setGlobalStatus = useSetGlobalStatus();
    const processPlayerlistEvents = useProcessPlayerlistEvents();
    const processUpdateAvailableEvent = useProcessUpdateAvailableEvent();

    useEffect(() => {
        const rooms = window.txConsts.isWebInterface ? ['status', 'playerlist'] : ['status'];
        const socket = getSocket(rooms);
        socket.on('connect', () => {
            console.log("Main Socket.IO Connected.");
            setIsSocketOffline(false);
        });
        socket.on('disconnect', (message) => {
            console.log("Main Socket.IO Disonnected:", message);
            //Grace period of 500ms to allow for quick reconnects
            //Tracking the state change ID for the timeout not to overwrite a reconnection
            const newId = socketStateChangeCounter.current + 1;
            socketStateChangeCounter.current = newId;
            setTimeout(() => {
                if (socketStateChangeCounter.current === newId) {
                    setIsSocketOffline(true);
                }
            }, 500);
        });
        socket.on('error', (error) => {
            console.log('Main Socket.IO', error);
        });
        socket.on('logout', function () {
            expireSession('main socketio');
        });
        socket.on('refreshToUpdate', function () {
            window.location.href = '/login#updated';
        });
        socket.on('status', function (status) {
            setGlobalStatus(status);
        });
        socket.on('playerlist', function (playerlistData) {
            if (!window.txConsts.isWebInterface) return;
            processPlayerlistEvents(playerlistData);
        });
        socket.on('updateAvailable', function (data) {
            processUpdateAvailableEvent(data);
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            setGlobalStatus(null);
        }
    }, []);


    return <>
        <Header />
        <div className="px-3 py-4 w-full max-w-[1920px] mx-auto flex flex-row gap-2">
            <ServerSidebar />
            <main className="flex flex-1 min-h-[calc(100vh-5.5rem-1px)]">
                <MainRouter />
            </main>
            {window.txConsts.isWebInterface && <PlayersSidebar />}
        </div>

        <MainSheets />
        <WarningBar />
        {/* <BreakpointDebugger /> */}
    </>;
}
