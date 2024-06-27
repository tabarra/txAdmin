import { memo, useCallback, useMemo, useState } from 'react';
import { Pie, DatumId, PieCustomLayerProps, ComputedDatum } from '@nivo/pie';
import { numberToLocaleString } from '@/lib/utils';
import { Loader2Icon, PieChartIcon } from 'lucide-react';
import { useIsDarkMode } from '@/hooks/theme';
import DebouncedResizeContainer from "@/components/DebouncedResizeContainer";
import { useAtomValue } from 'jotai';
import { dashPlayerDropAtom, useGetDashDataAge } from './dashboardHooks';


const defaultDropCategoryColor = '#A97CD2';
export const dropReasonCategories = {
    'user-initiated': {
        label: 'By user',
        color: '#7CD28F', //nivo
        // color2: '#005F73',
    },
    timeout: {
        label: 'Timeout',
        color: '#E8A838', //nivo
        // color2: '#0A9396',
    },
    'server-initiated': {
        label: 'By server',
        color: '#61CDBB', //nivo
        // color2: '#94D2BD',
    },
    unknown: {
        label: 'Unknown',
        color: '#E8C1A0', //nivo
        // color2: '#E9D8A6',
    },
    security: {
        label: 'Security',
        color: '#F47560', //nivo
        // color2: '#EE9B00',
    },
    crash: {
        label: 'Crash',
        color: '#F1E15B', //nivo
        // color2: '#BB3E03',
    },
} as { [key: string]: { label: string, color: string } };


type PlayerDropChartDatum = {
    id: string;
    label: string;
    value: number;
    count: number;
}


type PieCenterTextProps = PieCustomLayerProps<PlayerDropChartDatum> & {
    active?: ComputedDatum<PlayerDropChartDatum>;
};

const PieCenterText = ({ centerX, centerY, dataWithArc, innerRadius, active }: PieCenterTextProps) => {
    if (active) {
        return (<>
            <circle
                cx={centerX}
                cy={centerY}
                r={innerRadius * 0.95}
                fill={active.color}
            />
            <text
                x={centerX}
                y={centerY - 15}
                textAnchor="middle"
                dominantBaseline="central"
                className='text-xl font-bold'
                opacity={0.75}
            >
                {active.label}:
            </text>
            <text
                x={centerX}
                y={centerY + 15}
                textAnchor="middle"
                dominantBaseline="central"
                className='text-xl font-bold'
                opacity={0.75}
            >
                {numberToLocaleString(active.data.count)}
            </text>

        </>)
    } else {
        const totalDrops = useMemo(() => dataWithArc.reduce((acc, d) => acc + d.data.count, 0), [dataWithArc]);
        return (<>
            <text
                x={centerX}
                y={centerY - 15}
                textAnchor="middle"
                dominantBaseline="central"
                className='text-2xl font-bold fill-muted-foreground'
            >
                Total:
            </text>
            <text
                x={centerX}
                y={centerY + 15}
                textAnchor="middle"
                dominantBaseline="central"
                className='text-2xl font-bold fill-muted-foreground'
            >
                {numberToLocaleString(totalDrops)}
            </text>
        </>)
    }
}

type PlayerDropChartProps = {
    data: PlayerDropChartDatum[];
    activeId: DatumId | null;
    setActiveId: (id: DatumId | null) => void;
    width: number;
    height: number;
};

const PlayerDropChart = memo(({ data, activeId, setActiveId, width, height }: PlayerDropChartProps) => {
    const isDarkMode = useIsDarkMode();
    const [hasClicked, setHasClicked] = useState(false);
    const CenterLayer = useCallback((allArgs: PieCustomLayerProps<PlayerDropChartDatum>) => {
        if (!activeId) return PieCenterText(allArgs);
        const active = allArgs.dataWithArc.find(d => d.id === activeId);
        return PieCenterText({ ...allArgs, active });
    }, [activeId]);

    if (!width || !height) return null;
    return (
        <Pie
            data={data}
            height={height}
            width={width}
            theme={{
                text: {
                    fontSize: '13px',
                    fontWeight: 600,
                },
            }}
            activeId={activeId}
            onActiveIdChange={setActiveId}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
            innerRadius={0.6}
            padAngle={1.75}
            cornerRadius={4}
            activeOuterRadiusOffset={6}
            borderWidth={1}
            borderColor={isDarkMode ? undefined : {
                from: 'color',
                modifiers: [['darker', 0.8]]
            }}
            valueFormat={'.1%'}
            enableArcLinkLabels={false}
            layers={['arcs', 'arcLabels', 'arcLinkLabels', CenterLayer]}
            arcLabelsSkipAngle={20}
            arcLabelsTextColor={{
                from: 'color',
                modifiers: [['darker', 2.5]],
            }}
            onClick={(datum, event) => setHasClicked(curr => !curr)}
            onMouseEnter={(datum, event) => setHasClicked(false)} //resets behavior
            onMouseLeave={(datum, event) => {
                hasClicked && setActiveId(datum.id)
                event.preventDefault()
            }}
            colors={{ datum: 'data.color' }}
            tooltip={() => null}
            sortByValue
        />
    )
});


export default function PlayerDropCard() {
    const [activeId, setActiveId] = useState<DatumId | null>(null)
    const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
    const playerDropData = useAtomValue(dashPlayerDropAtom);
    const getDashDataAge = useGetDashDataAge();

    const chartData = useMemo(() => {
        if (!playerDropData?.summaryLast6h) return null;
        const dataAge = getDashDataAge();
        if (dataAge.isExpired) return null;
        if (!playerDropData.summaryLast6h.length) return 'not_enough_data';

        const totalDrops = playerDropData.summaryLast6h.reduce((acc, d) => acc + d[1], 0);
        return playerDropData.summaryLast6h.map(([reason, count]) => ({
            id: reason,
            label: dropReasonCategories[reason]?.label ?? reason,
            count,
            value: count / totalDrops,
            color: dropReasonCategories[reason]?.color ?? defaultDropCategoryColor,
        }));
    }, [playerDropData?.summaryLast6h]);


    const displayLegends = useMemo(() => {
        if (!playerDropData?.summaryLast6h) return null;
        const dataAge = getDashDataAge();
        if (dataAge.isExpired) return null;
        if (!playerDropData.summaryLast6h.length) return null;

        return playerDropData.summaryLast6h.map(([reason, count]) => ({
            id: reason,
            label: dropReasonCategories[reason]?.label ?? reason,
            color: dropReasonCategories[reason]?.color ?? defaultDropCategoryColor,
        }));
    }, [playerDropData?.summaryLast6h]);


    //Rendering
    let contentNode: React.ReactNode = null;
    if (typeof chartData === 'object' && chartData !== null) {
        contentNode = <PlayerDropChart
            data={chartData}
            activeId={activeId}
            setActiveId={setActiveId}
            width={chartSize.width}
            height={chartSize.height}
        />;
    } else if (typeof chartData === 'string') {
        contentNode = <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-center">
            <p className='max-w-80'>
                No players have disconnected from the server in the last 6 hours.
            </p>
        </div>;
    } else {
        contentNode = <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2Icon className="animate-spin size-16 text-muted-foreground" />
        </div>;
    }

    return (
        <div className="col-span-3 sm:col-span-2 2xl:col-span-3 py-2 md:rounded-xl border bg-card shadow-sm flex flex-col min-w-64 h-[20rem] max-h-[20rem]">
            <div className="px-4 flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                <h3 className="tracking-tight text-sm font-medium line-clamp-1">Player drop reasons (last 6h)</h3>
                <div className='hidden sm:block'><PieChartIcon /></div>
                {/* <div className='hidden sm:block'><DoorOpenIcon /></div> */}
            </div>
            {/* <div className='font-mono'>
                {Object.entries(dropReasonCategories).map(([reason, { label, color }]) => {
                    return (
                        <div key={reason} className='w-full pl-8 text-black' style={{ backgroundColor: color }}>{color} - {label}</div>
                    )
                })}
            </div> */}
            <DebouncedResizeContainer onDebouncedResize={setChartSize}>
                {contentNode}
            </DebouncedResizeContainer>
            {displayLegends && <div className='px-4 mx-auto flex flex-wrap justify-center gap-2'>
                {displayLegends.map(legend => {
                    return (
                        <div
                            key={legend.id}
                            data-active={activeId === legend.id}
                            className="flex items-center cursor-pointer hover:underline data-[active=true]:underline"
                            onClick={() => setActiveId(activeId === legend.id ? null : legend.id)}
                        >
                            <div className="size-4 mr-1 rounded-full" style={{ backgroundColor: legend.color }} />
                            <span className="text-sm">{legend.label}</span>
                        </div>
                    )
                })}
            </div>}
        </div>
    );
}
