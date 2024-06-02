import { BarChartHorizontalIcon } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import AutoSizer from "react-virtualized-auto-sizer";
import * as d3 from 'd3';
import { createRandomHslColor } from '@/lib/utils';

type FullPerfChartProps = any;

const FullPerfChart = memo(({
    data,
    width = 640,
    height = 400,
    marginTop = 20,
    marginRight = 20,
    marginBottom = 30,
    marginLeft = 40
}: FullPerfChartProps) => {
    const gx = useRef();
    const gy = useRef();
    const x = d3.scaleLinear([0, data.length - 1], [marginLeft, width - marginRight]);
    const y = d3.scaleLinear(d3.extent(data), [height - marginBottom, marginTop]);
    const line = d3.line((d, i) => x(i), y);
    useEffect(() => void d3.select(gx.current).call(d3.axisBottom(x)), [gx, x]);
    useEffect(() => void d3.select(gy.current).call(d3.axisLeft(y)), [gy, y]);
    return (
        <svg width={'100%'} height={height}>
            <rect
                x={(width / 2) - 50} y={0}
                width={50} height={10}
                fill={createRandomHslColor()}
                dominantBaseline={'hanging'}
            />
            <g ref={gx} transform={`translate(0,${height - marginBottom})`} />
            <g ref={gy} transform={`translate(${marginLeft},0)`} />
            <path fill="none" stroke="currentColor" strokeWidth="1.5" d={line(data)} />
            <g fill="white" stroke="currentColor" strokeWidth="1.5">
                {data.map((d, i) => (<circle key={i} cx={x(i)} cy={y(d)} r="2.5" />))}
            </g>
        </svg>
    );
});


type FullPerfCardProps = {
    //
};

export default function FullPerfCard({ }: FullPerfCardProps) {
    const [data, setData] = useState(() => d3.ticks(-2, 2, 200).map(Math.sin));
    function onMouseMove(event) {
        const [x, y] = d3.pointer(event);
        setData(data.slice(-200).concat(Math.atan2(x, y)));
    }

    return (
        <div className="w-full h-[32rem] py-2 rounded-lg border shadow-sm flex flex-col fill-primary">
            <div className="px-4 flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                <h3 className="tracking-tight text-sm font-medium line-clamp-1">Thread performance (last minute)</h3>
                <div className='hidden xs:block'><BarChartHorizontalIcon /></div>
            </div>
            <div className="size-full">
                <AutoSizer style={{ width: '100%' }} onMouseMove={onMouseMove}>
                    {({ height, width }) => (
                        <FullPerfChart data={data} height={height} width={width} />
                    )}
                </AutoSizer>
            </div>
        </div>
    );
}
