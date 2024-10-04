import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/utils';
import { useExpireAuthData, useSetAuthData } from '@/hooks/auth';
import { useSetGlobalStatus } from '@/hooks/status';
import { useProcessUpdateAvailableEvent, useSetOfflineWarning } from '@/hooks/useWarningBar';
import { useProcessPlayerlistEvents } from '@/hooks/playerlist';
import { LogoutReasonHash } from '@/pages/auth/Login';


/**
 * Responsible for starting ahd handling the main socket.io connection
 * This has been separated from the MainShell.tsx to avoid possible re-renders
 */
export default function MainSocket() {
    const expireSession = useExpireAuthData();
    const setAuthData = useSetAuthData();
    const socketStateChangeCounter = useRef(0);
    const setIsSocketOffline = useSetOfflineWarning();
    const setGlobalStatus = useSetGlobalStatus();
    const processPlayerlistEvents = useProcessPlayerlistEvents();
    const processUpdateAvailableEvent = useProcessUpdateAvailableEvent();

    //Runing on mount only
    useEffect(() => {
        //SocketIO
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
        socket.on('logout', function (reason) {
            expireSession('main socketio', reason);
        });
        socket.on('refreshToUpdate', function () {
            expireSession('main socketio', 'got refreshToUpdate', LogoutReasonHash.UPDATED);
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
        socket.on('updateAuthData', function (authData) {
            console.warn('Got updateAuthData from websocket', authData);
            setAuthData(authData);
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            setGlobalStatus(null);
        }
    }, []);

    return null;
}
