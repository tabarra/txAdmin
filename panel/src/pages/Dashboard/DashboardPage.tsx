import { useEffect, useMemo, useState } from 'react';
import { GaugeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThreadPerfCard from './ThreadPerfCard';
import PlayerDropCard from './PlayerDropCard';
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import { getMinTickIntervalMarker } from './chartingUtils';
import FullPerfCard from './FullPerfCard';

export type ThreadPerfChartDatum = {
    bucket: string | number;
    value: number;
    color: string;
    count: number;
}

export type PlayerDropChartDatum = {
    id: string;
    label: string;
    value: number;
    count: number;
}

export default function DashboardPage() {
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

    const threadPerfChartData = useMemo(() => {
        // const yLabels = ['5 ms', '10 ms', '25 ms', '50 ms', '75 ms', '100 ms', '250 ms', '500 ms', '750 ms', '1.0 s', '2.5 s', '5.0 s', '7.5 s', '10 s', '+Inf'];
        // const yLabels = ['1 ms', '2 ms', '4 ms', '6 ms', '8 ms', '10 ms', '15 ms', '20 ms', '30 ms', '50 ms', '70 ms', '100 ms', '150 ms', '250 ms', '+Inf'];
        const boundaries = [0.001, 0.002, 0.004, 0.006, 0.008, 0.010, 0.015, 0.020, 0.030, 0.050, 0.070, 0.100, 0.150, 0.250, '+Inf'];
        const minTickInterval = 0.050; // 50 ms - svMain

        const data: ThreadPerfChartDatum[] = [];
        for (let i = 0; i < boundaries.length; i++) {
            const bucketNum = i + 1;
            const indexPct = bucketNum / boundaries.length;
            data.push({
                bucket: boundaries[i],
                count: Math.round(Math.random() * 1000),
                value: Math.max(0, (Math.sin((indexPct + ztoCounter) * 2 * Math.PI) - 1) + 1), //rnd
                // value: Math.max(0, Math.sin(i * 0.24 + tmpMultiplier)) / 2.8, //rnd
                // value: Math.max(0, Math.sin(i * 0.295 + 0.7)) / 2.8, //good
                // value: Math.max(0, Math.sin(i * 0.295 + -0.6)) / 2.8, //bad

                // value: (1 + Math.sin(i * 0.295 + 0.7)) / 2.8 + 0.1,
                // value: (1 + Math.sin(i * 0.55 + 4)) / 2.8 + 0.1,

                // value: (1 + Math.cos(1.2 + i * 0.35)) / 2.8 + 0.1,
                // value: (1 + Math.sin(i * Math.PI / (2 * 9))) / 2.8 + 0.1,
                // color: i < goodThreshold
                //     ? d3ScaleChromatic.interpolateYlGn(1.3 - (bucketNum / goodThreshold))
                //     : d3ScaleChromatic.interpolateYlOrRd((bucketNum - goodThreshold) / (yLabels.length - goodThreshold)),
                color: d3ScaleChromatic.interpolateRdYlGn(1.3 - bucketNum / boundaries.length * 2),
            });
        }

        const minTickIntervalMarker = getMinTickIntervalMarker(boundaries, minTickInterval);

        return { data, minTickIntervalMarker, boundaries };
    }, [rndCounter]);

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
        <div className="w-full flex flex-col items-center justify-center gap-4">
            <div className="w-full grid grid-cols-8 gap-4 h-[22rem] max-h-[22rem] overflow-clip">
                <ThreadPerfCard data={threadPerfChartData} />
                <div className="py-2 px-4 rounded-lg border shadow-sm col-span-2 min-w-60 bg-card">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                        <h3 className="tracking-tight text-sm font-medium line-clamp-1">Host stats (last minute)</h3>
                        <div className='hidden xs:block'><GaugeIcon /></div>
                    </div>
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
