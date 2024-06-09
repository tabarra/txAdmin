import { useEffect, useMemo, useRef, useState } from 'react';
import { GaugeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThreadPerfCard from './ThreadPerfCard';
import PlayerDropCard from './PlayerDropCard';
import FullPerfCard from './FullPerfCard';
import { useAtomValue } from 'jotai';
import { dashPerfCursorAtom, useSetDashboardData } from './dashboardHooks';
import { getSocket } from '@/lib/utils';


export type PlayerDropChartDatum = {
    id: string;
    label: string;
    value: number;
    count: number;
}

export default function DashboardPage() {
    const pageSocket = useRef<ReturnType<typeof getSocket> | null>(null);
    const setDashboardData = useSetDashboardData();

    //Runing on mount only
    useEffect(() => {
        console.log('dashboard socket init');
        pageSocket.current = getSocket(['dashboard']);
        pageSocket.current.on('connect', () => {
            console.log("dashboard Socket.IO Connected.");
        });
        pageSocket.current.on('disconnect', (message) => {
            console.log("dashboard Socket.IO Disonnected:", message);
        });
        pageSocket.current.on('error', (error) => {
            console.log('dashboard Socket.IO', error);
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
    const [isRunning, setIsRunning] = useState(false);
    const [rndCounter, setRndCounter] = useState(491);
    const [ztoCounter, setZtoCounter] = useState(0);

    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            setRndCounter(num => num + Math.round(Math.random() * 50))
            setZtoCounter(num => (num + 0.02) % 1)
        }, 150);
        return () => clearInterval(interval);
    }, [isRunning]);

    const pieChartData = useMemo(() => {
        const tmpTotal = rndCounter + 135 + 180 + 169 + 365 + 365;
        const data = [
            {
                "id": "unknown",
                "label": "Unknown",
                count: rndCounter,
                value: rndCounter / tmpTotal,
            },
            {
                "id": "user-initiated",
                "label": "By user",
                count: 135,
                value: 135 / tmpTotal,
            },
            {
                "id": "server-initiated",
                "label": "By server",
                count: 180,
                value: 180 / tmpTotal,
            },
            {
                "id": "timeout",
                "label": "Timeout",
                count: 169,
                value: 169 / tmpTotal,
            },
            {
                "id": "security",
                "label": "Security",
                count: 365,
                value: 365 / tmpTotal,
            },
            {
                "id": "crash",
                "label": "Crash",
                count: 365,
                value: 365 / tmpTotal,
            }
        ].sort((a, b) => b.value - a.value) satisfies PlayerDropChartDatum[];
        return data;
    }, [rndCounter]);

    return (
        <div className="w-full min-w-96 flex flex-col items-center justify-center gap-4">
            <div className="w-full grid grid-cols-8 gap-4 h-[22rem] max-h-[22rem] overflow-clip">
                <ThreadPerfCard />
                <div className="py-2 px-4 rounded-lg border shadow-sm col-span-2 min-w-60 bg-card">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                        <h3 className="tracking-tight text-sm font-medium line-clamp-1">Host stats (last minute)</h3>
                        <div className='hidden xs:block'><GaugeIcon /></div>
                    </div>
                    <pre className='whitespace-pre-wrap'>
                        {JSON.stringify(cursorData, null, 2)}
                    </pre>
                    <div className="text-xl xs:text-2xl font-bold">
                        {rndCounter}
                    </div>
                    <div className="flex justify-between items-center">
                        <Button size={'xs'} onClick={() => setRndCounter(0)}>Reset</Button>
                        <Button size={'xs'} onClick={() => setRndCounter(99999)}>99999</Button>
                        <Button size={'xs'} onClick={() => setIsRunning(!isRunning)}>{isRunning ? 'stop' : 'start'}</Button>
                    </div>
                </div>
                <PlayerDropCard data={pieChartData} />
            </div>

            <FullPerfCard />
        </div>
    );
}
