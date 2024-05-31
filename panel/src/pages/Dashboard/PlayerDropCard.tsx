import { memo, useCallback, useMemo, useState } from 'react';
import { LegendDatum, ResponsivePie, DatumId, PieCustomLayerProps, ComputedDatum } from '@nivo/pie';
import { numberToLocaleString } from '@/lib/utils';
import { PlayerDropChartDatum } from './DashboardPage';
import { DoorOpenIcon } from 'lucide-react';

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
};

const PlayerDropChart = memo(({ data, setCustomLegends, activeId, setActiveId }: PlayerDropChartProps) => {
    const CenterLayer = useCallback((allArgs: PieCustomLayerProps<PlayerDropChartDatum>) => {
        if (!activeId) return PieCenterText(allArgs);
        const active = allArgs.dataWithArc.find(d => d.id === activeId);
        return PieCenterText({ ...allArgs, active });
    }, [activeId]);

    return <ResponsivePie
        theme={{
            text: {
                fontSize: '14px',
                fontWeight: 600,
            },
        }}
        data={data}
        activeId={activeId}
        onActiveIdChange={setActiveId}
        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        innerRadius={0.65}
        padAngle={1.75}
        cornerRadius={4}
        activeOuterRadiusOffset={6}
        borderWidth={1}
        borderColor={{
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
        colors={{
            // datum: 'data.color',
            // scheme: 'pink_yellowGreen',
            scheme: 'nivo',
            // scheme: 'yellow_orange_red',
            size: 6
        }}
        tooltip={() => null}
        forwardLegendData={setCustomLegends}
    />
});


type PlayerDropCardProps = {
    data: PlayerDropChartDatum[];
};

export default function PlayerDropCard({ data }: PlayerDropCardProps) {
    const [customLegends, setCustomLegends] = useState<LegendDatum<PlayerDropChartDatum>[]>([])
    const [activeId, setActiveId] = useState<DatumId | null>(null)

    return (
        <div className="py-2 rounded-lg border shadow-sm flex flex-col col-span-3">
            <div className="px-4 flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                <h3 className="tracking-tight text-sm font-medium line-clamp-1">Player drop reasons (last 6h)</h3>
                <div className='hidden sm:block'><DoorOpenIcon /></div>
            </div>
            <div className='size-full'>
                <PlayerDropChart
                    data={data}
                    setCustomLegends={setCustomLegends}
                    activeId={activeId}
                    setActiveId={setActiveId}
                />
            </div>
            <div className='px-4 mx-auto max-w-[25rem] flex flex-wrap justify-center gap-2'>
                {customLegends.map(legend => {
                    return (
                        <div
                            key={legend.id}
                            className="flex items-center cursor-pointer hover:underline"
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
