import { LineChartIcon, Loader2Icon } from 'lucide-react';
import React, { ReactNode, memo, useEffect, useMemo, useRef, useState } from 'react';
import DebouncedResizeContainer from '@/components/DebouncedResizeContainer';
import drawFullPerfChart from './drawFullPerfChart';
import { useBackendApi } from '@/hooks/fetch';
import type { PerfChartApiResp, PerfChartApiSuccessResp } from "@shared/otherTypes";
import useSWR from 'swr';
import { PerfSnapType, formatTickBoundary, getBucketTicketsEstimatedTime, getServerStatsData, getTimeWeightedHistogram, processPerfLog } from './chartingUtils';
import { dashServerStatsAtom, useThrottledSetCursor } from './dashboardHooks';
import { useIsDarkMode } from '@/hooks/theme';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSetAtom } from 'jotai';


type FullPerfChartProps = {
    threadName: string;
    apiData: PerfChartApiSuccessResp;
    apiDataAge: number;
    width: number;
    height: number;
    isDarkMode: boolean;
};

const FullPerfChart = memo(({ threadName, apiData, apiDataAge, width, height, isDarkMode }: FullPerfChartProps) => {
    const setServerStats = useSetAtom(dashServerStatsAtom);
    const svgRef = useRef<SVGSVGElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [renderError, setRenderError] = useState('');
    const [errorRetry, setErrorRetry] = useState(0);
    const setCursor = useThrottledSetCursor();
    const margins = {
        top: 8,
        right: 50,
        bottom: 30,
        left: 40,
        axis: 1
    };

    //Process data only once
    const processedData = useMemo(() => {
        if (!apiData) return null;
        const parsed = processPerfLog(apiData.threadPerfLog, (perfLog) => {
            const bucketTicketsEstimatedTime = getBucketTicketsEstimatedTime(apiData.boundaries);
            return getTimeWeightedHistogram(
                perfLog.buckets,
                bucketTicketsEstimatedTime
            );
        });
        if (!parsed) return null;

        return {
            ...parsed,
            bucketLabels: apiData.boundaries.map(formatTickBoundary),
            cursorSetter: (snap: PerfSnapType | undefined) => {
                if (!snap) return setCursor(undefined);
                setCursor({
                    threadName,
                    snap,
                });
            },
        }
    }, [apiData, apiDataAge, threadName, isDarkMode, renderError]);

    //Update server stats when data changes
    useEffect(() => {
        if (!processedData) {
            setServerStats(undefined);
        } else {
            const serverStatsData = getServerStatsData(processedData.lifespans, 24, apiDataAge);
            setServerStats(serverStatsData);
        }
    }, [processedData, apiDataAge]);


    //Redraw chart when data or size changes
    useEffect(() => {
        if (!processedData || !svgRef.current || !canvasRef.current || !width || !height) return;
        if (!processedData.lifespans.length) return; //only in case somehow the api returned, but no data found
        try {
            console.groupCollapsed('Drawing full performance chart:');
            console.time('drawFullPerfChart');
            drawFullPerfChart({
                svgRef: svgRef.current,
                canvasRef: canvasRef.current,
                setRenderError,
                size: { width, height },
                margins,
                isDarkMode,
                ...processedData,
            });
            setErrorRetry(0);
            setRenderError('');
            console.timeEnd('drawFullPerfChart');
        } catch (error) {
            setRenderError((error as Error).message ?? 'Unknown error.');
        } finally {
            console.groupEnd();
        }
    }, [processedData, width, height, svgRef, canvasRef, renderError]);


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
    return (<>
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
    </>);
});

function ChartErrorMessage({ error }: { error: Error | string }) {
    const errorMessageMaps: Record<string, ReactNode> = {
        bad_request: 'Chart data loading failed: bad request.',
        invalid_thread_name: 'Chart data loading failed: invalid thread name.',
        data_unavailable: 'Chart data loading failed: data not yet available.',
        not_enough_data: (<p className='text-center'>
            <strong>There is not enough data to display the chart just yet.</strong><br />
            <span className='text-base italic'>
                The chart requires at least 30 minutes of server runtime data to be available.
            </span>
        </p>),
    };

    if (typeof error === 'string') {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-2xl text-muted-foreground">
                {errorMessageMaps[error] ?? 'Unknown BackendApiError'}
            </div>
        );
    } else {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-2xl text-destructive-inline">
                Error: {error.message ?? 'Unknown Error'}
            </div>
        );
    }
}


export default function FullPerfCard() {
    const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
    const [selectedThread, setSelectedThread] = useState('svMain');
    const [apiFailReason, setApiFailReason] = useState('');
    const [apiDataAge, setApiDataAge] = useState(0);
    const isDarkMode = useIsDarkMode();

    const chartApi = useBackendApi<PerfChartApiResp>({
        method: 'GET',
        path: `/perfChartData/:thread/`,
    });

    const swrChartApiResp = useSWR(`/perfChartData/${selectedThread}`, async () => {
        setApiFailReason('');
        const data = await chartApi({
            pathParams: { thread: selectedThread },
        });
        if (!data) throw new Error('empty_response');
        if ('fail_reason' in data) {
            setApiFailReason(data.fail_reason);
            return null;
        }
        setApiDataAge(Date.now());
        return data;
    }, {
        //the data min interval is 5 mins, so we can safely cache for 1 min
        revalidateOnMount: true,
        revalidateOnFocus: false,
        refreshInterval: 60 * 1000,
    });

    //Rendering
    let contentNode: React.ReactNode = null;
    if (swrChartApiResp.data) {
        contentNode = <FullPerfChart
            threadName={selectedThread}
            apiData={swrChartApiResp.data as PerfChartApiSuccessResp}
            apiDataAge={apiDataAge}
            width={chartSize.width}
            height={chartSize.height}
            isDarkMode={isDarkMode}
        />;
    } else if (swrChartApiResp.isLoading) {
        contentNode = <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2Icon className="animate-spin size-16 text-muted-foreground" />
        </div>;
    } else if (apiFailReason || swrChartApiResp.error) {
        contentNode = <ChartErrorMessage error={apiFailReason || swrChartApiResp.error} />;
    }

    return (
        <div className="w-full h-[28rem] pt-2 md:rounded-xl border bg-card shadow-sm flex flex-col fill-primary">
            <div className="px-4 flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                <h3 className="tracking-tight text-sm font-medium line-clamp-1">
                    Server performance
                </h3>
                <div className="flex gap-4">
                    <Select defaultValue={selectedThread} onValueChange={setSelectedThread}>
                        <SelectTrigger className="w-32 grow md:grow-0 h-6 px-3 py-1 text-sm" >
                            <SelectValue placeholder="Filter by admin" />
                        </SelectTrigger>
                        <SelectContent className="px-0">
                            <SelectItem value={'svMain'} className="cursor-pointer">
                                svMain
                            </SelectItem>
                            <SelectItem value={'svSync'} className="cursor-pointer">
                                svSync
                            </SelectItem>
                            <SelectItem value={'svNetwork'} className="cursor-pointer">
                                svNetwork
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <div className='hidden xs:block'><LineChartIcon /></div>
                </div>
            </div>
            <DebouncedResizeContainer onDebouncedResize={setChartSize}>
                {contentNode}
            </DebouncedResizeContainer>
        </div>
    );
}
