import { memo, useEffect, useRef, useState } from "react";
import { useIsDarkMode } from "@/hooks/theme";
import { Button } from "@/components/ui/button";
import drawDropsTimeline, { TimelineDropsDatum } from "./drawDropsTimeline";

export type TimelineDropsChartData = {
    selectedPeriod: string;
    startDate: Date;
    endDate: Date;
    maxDrops: number;
    categoriesSorted: string[];
    log: TimelineDropsDatum[];
}

type TimelineDropsChartProps = {
    width: number;
    height: number;
    chartData: TimelineDropsChartData;
};

function TimelineDropsChart({ chartData, width, height }: TimelineDropsChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [renderError, setRenderError] = useState('');
    const [errorRetry, setErrorRetry] = useState(0);
    const isDarkMode = useIsDarkMode();
    const margins = {
        top: 8,
        right: 8,
        bottom: 24,
        left: 42,
        axis: 1
    };

    //Redraw chart when data or size changes
    useEffect(() => {
        if (!chartData || !svgRef.current || !canvasRef.current || !width || !height) return;
        if (!chartData.log.length) return; //only in case somehow the api returned, but no data found
        try {
            console.groupCollapsed('Drawing player drops:');
            console.time('drawDropsTimeline');
            drawDropsTimeline({
                svgRef: svgRef.current,
                canvasRef: canvasRef.current,
                setRenderError,
                size: { width, height },
                margins,
                isDarkMode,
                data: chartData,
            });
            setErrorRetry(0);
            setRenderError('');
            console.timeEnd('drawDropsTimeline');
        } catch (error) {
            setRenderError((error as Error).message ?? 'Unknown error.');
        } finally {
            console.groupEnd();
        }
    }, [chartData, width, height, isDarkMode, svgRef, canvasRef, renderError]);


    if (!width || !height) return null;
    if (renderError) {
        return <div className="absolute inset-0 p-4 flex flex-col gap-4 items-center justify-center text-center text-lg font-mono text-destructive-inline">
            Render Error: {renderError}
            <br />
            <Button
                size={'sm'}
                variant={'outline'}
                className='text-primary'
                onClick={() => {
                    setErrorRetry(c => c + 1);
                    setRenderError('');
                }}
            >
                Retry{errorRetry ? ` (${errorRetry})` : ''}
            </Button>
        </div>
    }
    return (
        <>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                style={{
                    zIndex: 1,
                    position: 'absolute',
                    top: '0px',
                    left: '0px',
                }}
            />
            <canvas
                ref={canvasRef}
                width={width - margins.left - margins.right}
                height={height - margins.top - margins.bottom}
                style={{
                    zIndex: 0,
                    position: 'absolute',
                    top: `${margins.top}px`,
                    left: `${margins.left}px`,
                }}
            />
        </>
    );
}

export default memo(TimelineDropsChart);
