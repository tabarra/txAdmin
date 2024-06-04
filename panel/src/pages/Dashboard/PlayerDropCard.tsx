import { memo, useCallback, useMemo, useState } from 'react';
import { LegendDatum, Pie, DatumId, PieCustomLayerProps, ComputedDatum } from '@nivo/pie';
import { numberToLocaleString } from '@/lib/utils';
import { PlayerDropChartDatum } from './DashboardPage';
import { DoorOpenIcon } from 'lucide-react';
import { useIsDarkMode } from '@/hooks/theme';
import DebouncedResizeContainer from "@/components/DebouncedResizeContainer";

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
                className='text-2xl font-bold'
                opacity={0.75}
            >
                {active.label}:
            </text>
            <text
                x={centerX}
                y={centerY + 15}
                textAnchor="middle"
                dominantBaseline="central"
                className='text-2xl font-bold'
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
                className='text-3xl font-bold fill-muted-foreground'
            >
                Total:
            </text>
            <text
                x={centerX}
                y={centerY + 15}
                textAnchor="middle"
                dominantBaseline="central"
                className='text-3xl font-bold fill-muted-foreground'
            >
                {numberToLocaleString(totalDrops)}
            </text>
        </>)
    }
}

type PlayerDropChartProps = {
    data: PlayerDropChartDatum[];
    setCustomLegends: (data: LegendDatum<PlayerDropChartDatum>[]) => void;
    activeId: DatumId | null;
    setActiveId: (id: DatumId | null) => void;
    width: number;
    height: number;
};

const PlayerDropChart = memo(({ data, setCustomLegends, activeId, setActiveId, width, height }: PlayerDropChartProps) => {
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
                    fontSize: '14px',
                    fontWeight: 600,
                },
            }}
            activeId={activeId}
            onActiveIdChange={setActiveId}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
            innerRadius={0.65}
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
            colors={{ scheme: 'nivo' }}
            tooltip={() => null}
            forwardLegendData={setCustomLegends}
        />
    )
});

const getInitialLegendsData = (data: PlayerDropChartDatum[]) => {
    return data.map(d => ({
        id: d.id,
        label: d.label,
        color: 'transparent',
    } as any));
}


type PlayerDropCardProps = {
    data: PlayerDropChartDatum[];
};

export default function PlayerDropCard({ data }: PlayerDropCardProps) {
    const [customLegends, setCustomLegends] = useState<LegendDatum<PlayerDropChartDatum>[]>(getInitialLegendsData(data))
    const [activeId, setActiveId] = useState<DatumId | null>(null)
    const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

    return (
        <div className="py-2 rounded-lg border bg-card shadow-sm flex flex-col col-span-3 min-w-64 h-[22rem] max-h-[22rem]">
            <div className="px-4 flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                <h3 className="tracking-tight text-sm font-medium line-clamp-1">Player drop reasons (last 6h)</h3>
                <div className='hidden sm:block'><DoorOpenIcon /></div>
            </div>
            <DebouncedResizeContainer onDebouncedResize={setChartSize}>
                <PlayerDropChart
                    data={data}
                    setCustomLegends={setCustomLegends}
                    activeId={activeId}
                    setActiveId={setActiveId}
                    width={chartSize.width}
                    height={chartSize.height}
                />
            </DebouncedResizeContainer>
            <div className='px-4 mx-auto max-w-[25rem] flex flex-wrap justify-center gap-2'>
                {customLegends.map(legend => {
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
            </div>
        </div>
    );
}
