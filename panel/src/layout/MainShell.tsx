import { useEventListener } from 'usehooks-ts';
import MainRouter from "./MainRouter";
import { useExpireAuthData } from '../hooks/auth';
import { Header } from './Header';
import { ServerSidebar } from './ServerSidebar/ServerSidebar';
import { PlayerlistSidebar } from './PlayerlistSidebar/PlayerlistSidebar';
import MainSheets from './MainSheets';
import WarningBar from './WarningBar';
import ConfirmDialog from '@/components/ConfirmDialog';
import PromptDialog from '@/components/PromptDialog';
import TxToaster from '@/components/TxToaster';
import AccountDialog from '@/components/AccountDialog';
import { useOpenAccountModal } from '@/hooks/dialogs';
import PlayerModal from './PlayerModal/PlayerModal';
import { playerModalUrlParam, useOpenPlayerModal } from '@/hooks/playerModal';
import { navigate as setLocation } from 'wouter/use-browser-location';
import MainSocket from './MainSocket';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useToggleTheme } from '@/hooks/theme';
import { hotkeyEventListener } from '@/lib/hotkeyEventListener';
import BreakpointDebugger from '@/components/BreakpointDebugger';
import ActionModal from './ActionModal/ActionModal';
import { useEffect } from 'react';
import { actionModalUrlParam, useOpenActionModal } from '@/hooks/actionModal';


export default function MainShell() {
    const expireSession = useExpireAuthData();
    const openAccountModal = useOpenAccountModal();
    const openPlayerModal = useOpenPlayerModal();
    const openActionModal = useOpenActionModal();
    const toggleTheme = useToggleTheme();

    //Listener for messages from child iframes (legacy routes) or other sources
    useEventListener('message', (e: TxMessageEvent) => {
        if (e.data.type === 'logoutNotice') {
            expireSession('child iframe', 'got logoutNotice');
        } else if (e.data.type === 'openAccountModal') {
            openAccountModal();
        } else if (e.data.type === 'openPlayerModal') {
            openPlayerModal(e.data.ref);
        } else if (e.data.type === 'navigateToPage') {
            setLocation(e.data.href);
        } else if (e.data.type === 'globalHotkey' && e.data.action === 'toggleLightMode') {
            toggleTheme();
        }
    });

    //auto open the player or action modals
    useEffect(() => {
        const pageUrl = new URL(window.location.toString());
        const playerModalRef = pageUrl.searchParams.get(playerModalUrlParam);
        const actionModalRef = pageUrl.searchParams.get(actionModalUrlParam);
        if (!playerModalRef && !actionModalRef) return;

        if (playerModalRef) {
            if (playerModalRef.includes('#')) {
                const [mutex, rawNetid] = playerModalRef.split('#');
                const netid = parseInt(rawNetid);
                if (mutex.length && rawNetid.length && !isNaN(netid)) {
                    return openPlayerModal({ mutex, netid });
                }
            } else if (playerModalRef.length) {
                return openPlayerModal({ license: playerModalRef });
            }
        } else if (actionModalRef && actionModalRef.length) {
            return openActionModal(actionModalRef);
        }

        //Remove the query params
        pageUrl.searchParams.delete(playerModalUrlParam);
        pageUrl.searchParams.delete(actionModalUrlParam);
        window.history.replaceState({}, '', pageUrl);
    }, []);

    //Listens to hotkeys
    //NOTE: WILL NOT WORK IF THE FOCUS IS ON THE IFRAME
    useEventListener('keydown', hotkeyEventListener);

    return <>
        <TooltipProvider delayDuration={300} disableHoverableContent={true}>
            <Header />
            <div className="md:px-3 min-h-full pt-2 md:py-4 w-full max-w-[1920px] mx-auto flex flex-row gap-4">
                <ServerSidebar />
                <main className="flex flex-1 min-h-[calc(100vh-4rem-1px)] md:min-h-[calc(100vh-5.5rem-1px)]">
                    <MainRouter />
                </main>
                {window.txConsts.isWebInterface && <PlayerlistSidebar />}
            </div>

            <MainSheets />
            <WarningBar />
            <ConfirmDialog />
            <PromptDialog />
            <TxToaster />
            <AccountDialog />
            <PlayerModal />
            <ActionModal />
            <MainSocket />
            {/* <BreakpointDebugger /> */}
        </TooltipProvider>
    </>;
}
