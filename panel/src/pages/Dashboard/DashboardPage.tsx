import { useEffect, useMemo, useState } from 'react';
import { BarChartHorizontalIcon, GaugeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlayerDropCard from './PlayerDropCard';

export type PlayerDropChartDatum = {
    id: string;
    label: string;
    value: number;
    count: number;
}

export default function DashboardPage() {
    const [num, setNum] = useState(491);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setNum(num => num + Math.round(Math.random() * 50))
        }, 333);
        return () => clearInterval(interval);
    }, []);

    const pieChartData = useMemo(() => {
        const tmpTotal = num + 135 + 180 + 169 + 365 + 365;
        const data = [
            {
                "id": "unknown",
                "label": "Unknown",
                count: num,
                value: num / tmpTotal,
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
                "id": "networking",
                "label": "Networking",
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
    }, [num]);


    return (
        <div className="w-full flex flex-col items-center justify-center gap-2">
            <div className="w-full h-80 grid grid-cols-8 gap-4">

                <div className="py-2 px-4 rounded-lg border shadow-sm col-span-3">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                        <h3 className="tracking-tight text-sm font-medium line-clamp-1">Thread performance (last minute)</h3>
                        <div className='hidden xs:block'><BarChartHorizontalIcon /></div>
                    </div>
                    <div className="text-xl xs:text-2xl font-bold">
                        {num}
                    </div>
                </div>

                <div className="py-2 px-4 rounded-lg border shadow-sm col-span-2">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                        <h3 className="tracking-tight text-sm font-medium line-clamp-1">Host stats (last minute)</h3>
                        <div className='hidden xs:block'><GaugeIcon /></div>
                    </div>
                    <div className="text-xl xs:text-2xl font-bold">
                        {num}
                    </div>
                    <div className="flex justify-between items-center">
                        <Button size={'xs'} onClick={() => setNum(0)}>Reset</Button>
                        <Button size={'xs'} onClick={() => setNum(99999)}>99999</Button>
                    </div>
                </div>

                <PlayerDropCard data={pieChartData} />

            </div>
            <button
                className="bg-fuchsia-600 text-4xl"
                onClick={() => setNum(Math.round(Math.random() * 50))}
            >click me!</button>
        </div>
    );
}
