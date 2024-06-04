import { LineChartIcon } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { createRandomHslColor } from '@/lib/utils';
import DebouncedResizeContainer from '@/components/DebouncedResizeContainer';
import drawFullPerfChart from './drawFullPerfChart';

type FullPerfChartProps = {
    data: any[]; //FIXME:
    width: number;
    height: number;
};

const FullPerfChart = memo(({ data, width, height }: FullPerfChartProps) => {
    const margins = { top: 0, right: 50, bottom: 30, left: 40 };
    const svgRef = useRef<SVGSVGElement>(null);
    useEffect(() => {
        if (!svgRef.current || !width || !height) return;
        drawFullPerfChart(svgRef.current, {width, height}, margins);
    }, [data, width, height, svgRef]);
    if (!width || !height) return null;
    return (
        <svg
            ref={svgRef}
            width={width}
            height={height}
            // style={{ backgroundColor: createRandomHslColor() }}
        />
    );
});



type FullPerfCardProps = {
    //
};

export default function FullPerfCard({ }: FullPerfCardProps) {
    const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
    const [data, setData] = useState(() => d3.ticks(-2, 2, 200).map(Math.sin));

    return (
        <div className="w-full h-[32rem] py-2 rounded-lg border shadow-sm flex flex-col fill-primary">
            <div className="px-4 flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                <h3 className="tracking-tight text-sm font-medium line-clamp-1">Server performance</h3>
                <div className='hidden xs:block'><LineChartIcon /></div>
            </div>
            <DebouncedResizeContainer onDebouncedResize={setChartSize}>
                <FullPerfChart data={data} width={chartSize.width} height={chartSize.height} />
            </DebouncedResizeContainer>
        </div>
    );
}
