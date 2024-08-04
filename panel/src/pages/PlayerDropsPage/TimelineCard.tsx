import DebouncedResizeContainer from "@/components/DebouncedResizeContainer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DoorOpenIcon } from "lucide-react";
import { memo, useMemo, useState } from "react";
import type { PlayerDropsSummaryHour } from "@shared/otherTypes";
import { PlayerDropsLoadingSpinner } from "./PlayerDropsGenericSubcards";
import TimelineDropsChart, { TimelineDropsChartData } from "./TimelineDropsChart";
import { processDropsSummary } from "./chartingUtils";
import { DisplayLodType, DrilldownRangeSelectionType } from "./PlayerDropsPage";


type PlayerDropsTimelineChartsProps = {
    isError?: boolean;
    summaryData?: PlayerDropsSummaryHour[];
    rangeSelected: DrilldownRangeSelectionType;
    rangeSetter: (range: DrilldownRangeSelectionType) => void;
    displayLod: DisplayLodType;
    setDisplayLod: (range: DisplayLodType) => void;
};
const TimelineCard = memo(({
    summaryData,
    isError,
    rangeSelected,
    rangeSetter,
    displayLod,
    setDisplayLod
}: PlayerDropsTimelineChartsProps) => {
    const [expectedDropsChartSize, setExpectedDropsChartSize] = useState({ width: 0, height: 0 });
    const [unexpectedDropsChartSize, setUnexpectedDropsChartSize] = useState({ width: 0, height: 0 });

    //Process data only once
    const chartsData = useMemo(() => {
        if (!summaryData) return;
        const windowDays = displayLod === 'day' ? 14 : 7;
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - windowDays * 24, 0, 0, 0);
        const processed = processDropsSummary(summaryData, displayLod, startDate);
        if (!processed) return;
        const endPaddingHours = displayLod === 'day' ? 12 : 1; //small offset at the end of the chart

        const commonProps = {
            displayLod,
            startDate,
            endDate: new Date(Date.now() + endPaddingHours * 60 * 60 * 1000),
        };
        return {
            expected: {
                ...commonProps,
                maxDrops: processed.expectedSeriesMax,
                categoriesSorted: processed.expectedCategoriesSorted,
                log: processed.expectedSeries,
            } satisfies TimelineDropsChartData,
            unexpected: {
                ...commonProps,
                maxDrops: processed.unexpectedSeriesMax,
                categoriesSorted: processed.unexpectedCategoriesSorted,
                log: processed.unexpectedSeries,
            } satisfies TimelineDropsChartData,
        }
    }, [summaryData, displayLod]);

    return (
        <div className="md:rounded-xl border bg-card shadow-sm flex flex-col">
            <div className="flex flex-row items-center justify-between px-1 sm:px-4 border-b rounded-t-xl bg-secondary/35">
                <div className="flex items-center py-2 space-x-2">
                    <div className='hidden xs:block'><DoorOpenIcon className="size-4" /></div>
                    <h2 className="font-mono text-sm">Expected Player Drops</h2>
                </div>
                <Select defaultValue={displayLod} onValueChange={setDisplayLod}>
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
                <DebouncedResizeContainer onDebouncedResize={setExpectedDropsChartSize}>
                    {chartsData ? (
                        <TimelineDropsChart
                            chartData={chartsData.expected}
                            chartName='expected'
                            width={expectedDropsChartSize.width}
                            height={expectedDropsChartSize.height}
                            rangeSelected={rangeSelected}
                            rangeSetter={rangeSetter}
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
            </div>
            <div className="h-52 max-h-52">
                <DebouncedResizeContainer onDebouncedResize={setUnexpectedDropsChartSize}>
                    {chartsData ? (
                        <TimelineDropsChart
                            chartData={chartsData.unexpected}
                            chartName='unexpected'
                            width={unexpectedDropsChartSize.width}
                            height={unexpectedDropsChartSize.height}
                            rangeSelected={rangeSelected}
                            rangeSetter={rangeSetter}
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
