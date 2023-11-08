import { useEventListener } from 'usehooks-ts';
import MainRouter from "./MainRouter";
import { useExpireAuthData } from '../hooks/auth';
import BreakpointDebugger from '@/components/BreakpointDebugger';
import { Header } from './Header';
import { ServerSidebar } from './ServerSidebar';
import { PlayersSidebar } from './PlayerSidebar';


export default function MainShell() {
    const expireSession = useExpireAuthData();
    useEventListener('message', (e: MessageEventFromIframe) => {
        if (e.data.type === 'logoutNotice') {
            expireSession('child iframe');
        }
    });

    return <>
        <Header />
        <div className="px-3 py-4 w-full max-w-[1920px] flex flex-row gap-2">
            <ServerSidebar />
            <main className="flex flex-1 min-h-[calc(100vh-5.5rem-1px)]">
                <MainRouter />
            </main>
            <PlayersSidebar />
        </div>
        {/* DEBUG Breakpoint */}
        {/* <BreakpointDebugger /> */}
    </>;
}
