import { useEffect, useRef } from 'react';
import { GaugeIcon } from 'lucide-react';
import ThreadPerfCard from './ThreadPerfCard';
import PlayerDropCard from './PlayerDropCard';
import FullPerfCard from './FullPerfCard';
import { useAtomValue } from 'jotai';
import { dashPerfCursorAtom, dashSvRuntimeAtom, useSetDashboardData } from './dashboardHooks';
import { getSocket } from '@/lib/utils';


export default function DashboardPage() {
    const pageSocket = useRef<ReturnType<typeof getSocket> | null>(null);
    const setDashboardData = useSetDashboardData();

    //Runing on mount only
    useEffect(() => {
        pageSocket.current = getSocket(['dashboard']);
        pageSocket.current.on('connect', () => {
            console.log("Dashboard Socket.IO Connected.");
        });
        pageSocket.current.on('disconnect', (message) => {
            console.log("Dashboard Socket.IO Disonnected:", message);
        });
        pageSocket.current.on('error', (error) => {
            console.log('Dashboard Socket.IO', error);
        });
        pageSocket.current.on('dashboard', function (data) {
            setDashboardData(data);
        });

        return () => {
            pageSocket.current?.removeAllListeners();
            pageSocket.current?.disconnect();
        }
    }, []);

    //DEBUG
    const cursorData = useAtomValue(dashPerfCursorAtom);
    const svRuntimeData = useAtomValue(dashSvRuntimeAtom);

    return (
        <div className="w-full min-w-96 flex flex-col gap-4">
            <div className="w-full grid grid-cols-8 gap-4 h-[20rem] max-h-[20rem] overflow-clip">
                <PlayerDropCard />
                <div className="py-2 px-4 rounded-lg border shadow-sm col-span-2 min-w-60 bg-card">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                        <h3 className="tracking-tight text-sm font-medium line-clamp-1">Host stats (last minute)</h3>
                        <div className='hidden xs:block'><GaugeIcon /></div>
                    </div>
                    <pre className='whitespace-pre-wrap'>
                        {JSON.stringify(cursorData ?? svRuntimeData, null, 2)}
                    </pre>
                </div>
                <ThreadPerfCard />
            </div>

            <FullPerfCard />
        </div>
    );
}
