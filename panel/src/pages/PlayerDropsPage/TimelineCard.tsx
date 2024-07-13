import DebouncedResizeContainer from "@/components/DebouncedResizeContainer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DoorOpenIcon } from "lucide-react";
import { memo, useMemo, useState } from "react";
import type { PlayerDropsSummaryHour } from "@shared/otherTypes";
import { PlayerDropsLoadingSpinner } from "./PlayerDropsGenericSubcards";
import TimelineDropsChart, { TimelineDropsChartData } from "./TimelineDropsChart";
import { processDropsSummary } from "./chartingUtils";
import { playerDropCategories, PlayerDropCategoryType } from "@/lib/playerDropCategories";

type ChartLabelProps = {
    categories: [name: string, data: PlayerDropCategoryType][];
};
//FIXME: remove this?
function ChartLabel({ categories }: ChartLabelProps) {
    return (
        <div className='px-4 mx-auto flex flex-wrap justify-center gap-2'>
            {categories.map(([catName, catData]) => {
                return (
                    <div key={catName} className="flex items-center">
                        <div className="size-4 mr-1 rounded-full" style={{ backgroundColor: catData.color }} />
                        <span className="text-sm">{catData.label}</span>
                    </div>
                )
            })}
        </div>
    )
}


type PlayerDropsTimelineChartsProps = {
    isError?: boolean;
    summaryData?: PlayerDropsSummaryHour[];
};
const TimelineCard = memo(({ summaryData, isError }: PlayerDropsTimelineChartsProps) => {
    const [selectedPeriod, setSelectedPeriod] = useState<string>('hour');
    const [typicalDropsChartSize, setTypicalDropsChartSize] = useState({ width: 0, height: 0 });
    const [atypicalDropsChartSize, setAtypicalDropsChartSize] = useState({ width: 0, height: 0 });
    const [crashesChartSize, setCrashesChartSize] = useState({ width: 0, height: 0 });

    //Process data only once
    const chartsData = useMemo(() => {
        if (!summaryData) return;
        const windowDays = selectedPeriod === 'day' ? 14 : 7;
        // const windowDays = 7;
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - windowDays * 24, 0, 0, 0);
        const processed = processDropsSummary(summaryData, selectedPeriod, startDate);
        const thirtyMinsInMs = 30 * 60 * 1000; //small offset at the end of the chart
        //FIXME: change to 1 hour? since it draws ahead of the current hour start X

        const commonProps = {
            selectedPeriod,
            startDate,
            endDate: new Date(Date.now() + thirtyMinsInMs),
        };
        return {
            typical: {
                ...commonProps,
                maxDrops: processed.typicalSeriesMax,
                categoriesSorted: processed.typicalCategoriesSorted,
                log: processed.typicalSeries,
            } satisfies TimelineDropsChartData,
            atypical: {
                ...commonProps,
                maxDrops: processed.atypicalSeriesMax,
                categoriesSorted: processed.atypicalCategoriesSorted,
                log: processed.atypicalSeries,
            } satisfies TimelineDropsChartData,
            crashes: {
                ...commonProps,
                maxDrops: processed.crashesSeriesMax,
                categoriesSorted: ['crash'],
                log: processed.crashSeries,
            } satisfies TimelineDropsChartData,
        }
    }, [summaryData, selectedPeriod]);

    const typicalCategories = Object.entries(playerDropCategories)
        .filter(([_, catData]) => catData.typical);
    const atypicalCategories = Object.entries(playerDropCategories)
        .filter(([_, catData]) => !catData.typical);
    return (
        <div className="md:rounded-xl border bg-card shadow-sm flex flex-col">
            <div className="flex flex-row items-center justify-between px-1 sm:px-4 border-b rounded-t-xl bg-secondary/35">
                <div className="flex items-center py-2 space-x-2">
                    <div className='hidden xs:block'><DoorOpenIcon className="size-4" /></div>
                    <h2 className="font-mono text-sm">Expected Player Drops</h2>
                </div>
                <ChartLabel categories={typicalCategories} />
                <Select defaultValue={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger
                        className="w-32 h-6 px-3 py-1 text-sm"
                    >
                        <SelectValue placeholder="Filter by admin" />
                    </SelectTrigger>
                    <SelectContent className="px-0">
                        <SelectItem value={'day'} className="cursor-pointer">
                            Days
                        </SelectItem>
                        <SelectItem value={'hour'} className="cursor-pointer">
                            Hours
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="h-32 max-h-32">
                <DebouncedResizeContainer onDebouncedResize={setTypicalDropsChartSize}>
                    {chartsData ? (
                        <TimelineDropsChart
                            chartData={chartsData.typical}
                            width={typicalDropsChartSize.width}
                            height={typicalDropsChartSize.height}
                        />
                    ) : (
                        <PlayerDropsLoadingSpinner isError={isError} />
                    )}
                </DebouncedResizeContainer>
            </div>

            <div className="flex flex-row items-center justify-between px-1 sm:px-4 border-t border-b bg-secondary/35">
                <div className="flex items-center py-2 gap-2">
                    <div className='hidden xs:block'><DoorOpenIcon className="size-4" /></div>
                    <h2 className="font-mono text-sm">Unexpected Player Drops</h2>
                </div>
                <ChartLabel categories={atypicalCategories} />
                <div className="w-[128px]"></div>
            </div>
            <div className="h-52 max-h-52">
                <DebouncedResizeContainer onDebouncedResize={setAtypicalDropsChartSize}>
                    {chartsData ? (
                        <TimelineDropsChart
                            chartData={chartsData.atypical}
                            width={atypicalDropsChartSize.width}
                            height={atypicalDropsChartSize.height}
                        />
                    ) : (
                        <PlayerDropsLoadingSpinner isError={isError} />
                    )}
                </DebouncedResizeContainer>
            </div>
        </div>
    );
});

export default memo(TimelineCard);
