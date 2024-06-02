import AutoSizer from "react-virtualized-auto-sizer";
import { Bar, BarTooltipProps } from '@nivo/bar';
import { BarChartHorizontalIcon } from 'lucide-react';
import { memo } from 'react';
import { useIsDarkMode } from '@/hooks/theme';
import { ThreadPerfChartDatum } from './DashboardPage';
import { formatTickBoundary } from './chartingUtils';


type ThreadPerfChartProps = {
    data: ThreadPerfChartDatum[];
    boundaries: (number | string)[];
    minTickIntervalMarker: number | undefined;
};

const ThreadPerfChart = memo(({ data, minTickIntervalMarker }: ThreadPerfChartProps) => {
    const isDarkMode = useIsDarkMode();

    const CustomToolbar = (datum: BarTooltipProps<ThreadPerfChartDatum>) => {
        const lowerLimit = data.find((_, index) => index === datum.index - 1)?.bucket ?? 0;
        const upperLimit = datum.data.bucket;
        const pctString = (datum.value * 100).toFixed() + '%';
        return (
            <div className="p-3 text-gray-900 bg-white rounded-md shadow-md">
                <div>
                    Tick duration: <strong>{formatTickBoundary(lowerLimit)}</strong> ~ <strong>{formatTickBoundary(upperLimit)}</strong>
                </div>
                <div>
                    Time spent: <strong>~{pctString}</strong>
                </div>
                <div>
                    Tick count: {datum.data.count}
                </div>
            </div>
        );
    }

    return (
        <AutoSizer style={{ width: '100%' }}>
            {({ height, width }) => (
                <Bar
                    height={height}
                    width={width}
                    data={data}
                    theme={{
                        tooltip: { wrapper: { zIndex: 10000 } },
                        text: {
                            fontSize: '12px',
                            fontWeight: 600,
                            fill: 'inherit',
                        },
                        grid: {
                            line: {
                                strokeDasharray: '8 6',
                                stroke: '#3F4146', //secondary
                                strokeOpacity: isDarkMode ? 1 : 0.25,
                                strokeWidth: 1,
                            },
                        }
                    }}
                    indexBy="bucket"
                    margin={{ top: 0, right: 25, bottom: 40, left: 60 }}
                    layout="horizontal"
                    valueFormat={'.1%'}
                    colors={{ datum: 'data.color' }}
                    colorBy='indexValue'
                    borderWidth={0.5}
                    borderColor={isDarkMode ? undefined : {
                        from: 'color',
                        modifiers: [['darker', 1]]
                    }}
                    axisBottom={{
                        format: '.0%',
                        legend: 'percent of total time',
                        legendPosition: 'middle',
                        legendOffset: 32,
                    }}
                    axisLeft={{ format: formatTickBoundary }}
                    enableGridX={true}
                    enableGridY={false}
                    labelSkipWidth={25}
                    labelSkipHeight={12}
                    labelTextColor={{
                        from: 'color',
                        modifiers: [['darker', 1.6]]
                    }}
                    tooltip={CustomToolbar}
                    markers={minTickIntervalMarker ? [
                        {
                            axis: 'y',
                            value: minTickIntervalMarker,
                            lineStyle: {
                                stroke: 'black',
                                strokeWidth: 4,
                                strokeDasharray: '6 2',
                                strokeDashoffset: 1,
                            },
                        },
                        {
                            axis: 'y',
                            value: minTickIntervalMarker,
                            lineStyle: {
                                stroke: '#F513B3',
                                strokeWidth: 2,
                                strokeDasharray: '4 4',
                            },
                            legendPosition: 'bottom-right',
                            legend: 'uh oh!',
                        },
                    ] : undefined}
                />
            )}
        </AutoSizer>
    );
});


type ThreadPerfCardProps = {
    data: ThreadPerfChartProps;
};

export default function ThreadPerfCard({ data }: ThreadPerfCardProps) {
    return (
        <div className="py-2 rounded-lg border shadow-sm flex flex-col col-span-3 fill-primary">
            <div className="px-4 flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                <h3 className="tracking-tight text-sm font-medium line-clamp-1">Thread performance (last minute)</h3>
                <div className='hidden xs:block'><BarChartHorizontalIcon /></div>
            </div>
            <div className="size-full">
                <ThreadPerfChart {...data} />
            </div>
        </div>
    );
}
