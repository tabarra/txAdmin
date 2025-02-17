import { useEffect, useRef } from 'react';
import ThreadPerfCard from './ThreadPerfCard';
import PlayerDropCard from './PlayerDropCard';
import FullPerfCard from './FullPerfCard';
import { useSetDashboardData } from './dashboardHooks';
import { getSocket } from '@/lib/utils';
import ServerStatsCard from './ServerStatsCard';
import { useAtomValue } from 'jotai';
import { txConfigStateAtom } from '@/hooks/status';
import { useLocation } from 'wouter';
import { TxConfigState } from '@shared/enums';
import ModalCentralMessage from '@/components/ModalCentralMessage';
import GenericSpinner from '@/components/GenericSpinner';


function DashboardPageInner() {
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

    return (
        <div className="w-full min-w-96 flex flex-col gap-4">
            <div className="w-full grid grid-cols-3 2xl:grid-cols-8 gap-4">
                <PlayerDropCard />
                <ServerStatsCard />
                <ThreadPerfCard />
            </div>
            <FullPerfCard />

            {/* TODO: maybe convert in top server warning */}
            {/* <div className="mx-auto max-w-4xl w-full sm:w-auto sm:min-w-[28rem] relative overflow-hidden z-40 p-3 pr-10 flex items-center justify-between space-x-4 rounded-xl border shadow-lg transition-all text-black/75 dark:text-white/90 border-warning/70 bg-warning-hint animate-toastbar-enter opacity-50 hover:opacity-100">
                <div className="flex-shrink-0 flex flex-col gap-2 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-warning stroke-warning animate-toastbar-icon">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                    </svg>
                </div>
                <div className="flex-grow">
                    <span className="block whitespace-pre-line">
                        <b>This update changes how the performance chart show its data.</b> <br />
                        Now the histogram (colors) are based on the time spent on each bucket instead of the number of ticks. And the bucket boundaries (ms) may have changed to have a better resolution at lower tick times.
                    </span>
                </div>
            </div> */}
        </div>
    );
}


export default function DashboardPage() {
    const txConfigState = useAtomValue(txConfigStateAtom);
    const setLocation = useLocation()[1];

    if (txConfigState === TxConfigState.Setup) {
        setLocation('/server/setup');
        return null;
    } else if (txConfigState === TxConfigState.Deployer) {
        setLocation('/server/deployer');
        return null;
    } else if (txConfigState !== TxConfigState.Ready) {
        return <div className='size-full'>
            <ModalCentralMessage>
            <GenericSpinner msg={`Unknown Config State: ${String(txConfigState)}`} />
        </ModalCentralMessage>
        </div>;
    } else {
        return <DashboardPageInner />;
    }
}
