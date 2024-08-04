import { PlayerDropsSummaryHour } from "@shared/otherTypes";
import { playerDropExpectedCategories, playerDropUnexpectedCategories } from "@/lib/playerDropCategories";
import { TimelineDropsDatum } from "./drawDropsTimeline";

export type PlayerDropsCategoryCount = [category: string, count: number];

/**
 * Processes the player drops summary api data to return the data for the timeline chart.
 * 
 * OBJECTIVES:
 * 1. separate expected and unexpected drops
 * 2. get max drops per expected/unexpected category to size the Y axis'
 * 3. sort the expected/unexpected category by cumulative drops for displaying in consistent order
 */
export const processDropsSummary = (apiData: PlayerDropsSummaryHour[], selectedPeriod: string, windowStart: Date) => {
    const tsWindowStart = windowStart.getTime();
    const windowStartIndex = apiData.findIndex(hourData => (new Date(hourData.hour)).getTime() >= tsWindowStart);
    const windowData = apiData.slice(windowStartIndex);
    //FIXME: consider the selectedPeriod for the time range

    //Separate expected and unexpected drops so we can sort the categories by total drops
    const expectedCategoriesDropsTotal = Object.fromEntries(playerDropExpectedCategories.map(cat => [cat, 0]));
    const unexpectedCategoriesDropsTotal = Object.fromEntries(playerDropUnexpectedCategories.map(cat => [cat, 0]));

    //Get the max drops per category to size the Y axis
    let expectedSeriesMax = 0;
    let unexpectedSeriesMax = 0;

    //Process the data
    const series = [];
    for (const hourData of windowData) {
        const expectedDrops: PlayerDropsCategoryCount[] = [];
        const unexpectedDrops: PlayerDropsCategoryCount[] = [];
        let hourExpectedTotalDrops = 0;
        let hourUnexpectedTotalDrops = 0;
        for (const [catName, catCount] of hourData.dropTypes) {
            if (playerDropExpectedCategories.includes(catName)) {
                hourExpectedTotalDrops += catCount;
                expectedDrops.push([catName, catCount]);
                expectedCategoriesDropsTotal[catName] += catCount;
            } else {
                hourUnexpectedTotalDrops += catCount;
                unexpectedDrops.push([catName, catCount]);
                unexpectedCategoriesDropsTotal[catName] += catCount;
            }
        }
        expectedSeriesMax = Math.max(expectedSeriesMax, hourExpectedTotalDrops);
        unexpectedSeriesMax = Math.max(unexpectedSeriesMax, hourUnexpectedTotalDrops);
        series.push({
            hasChanges: hourData.hasChanges,
            expectedDrops: expectedDrops,
            unexpectedDrops: unexpectedDrops,
        });
    }

    //Sort categories by total drops
    const expectedCategoriesSorted = Object.entries(expectedCategoriesDropsTotal)
        .sort((a, b) => b[1] - a[1]);
    const expectedCategoriesOrder = Object.fromEntries(
        expectedCategoriesSorted.map(([cat, _], index) => [cat, index])
    );
    const unexpectedCategoriesSorted = Object.entries(unexpectedCategoriesDropsTotal)
        .sort((a, b) => b[1] - a[1]);
    const unexpectedCategoriesOrder = Object.fromEntries(
        unexpectedCategoriesSorted.map(([cat, _], index) => [cat, index])
    );

    //Separate the series and sort drops by category
    const expectedSeries: TimelineDropsDatum[] = [];
    const unexpectedSeries: TimelineDropsDatum[] = [];
    for (let i = 0; i < windowData.length; i++) {
        const hourData = windowData[i];
        const seriesData = series[i];
        if (!seriesData) continue;
        const currHour = new Date(hourData.hour);
        expectedSeries.push({
            hour: currHour,
            hasChanges: seriesData.hasChanges,
            drops: seriesData.expectedDrops.sort(([aCat], [bCat]) => {
                return expectedCategoriesOrder[aCat] - expectedCategoriesOrder[bCat];
            }),
        });
        unexpectedSeries.push({
            hour: currHour,
            hasChanges: seriesData.hasChanges,
            drops: seriesData.unexpectedDrops.sort(([aCat], [bCat]) => {
                return unexpectedCategoriesOrder[aCat] - unexpectedCategoriesOrder[bCat];
            }),
        });
    }

    return {
        expectedSeries: expectedSeries,
        expectedSeriesMax: expectedSeriesMax,
        expectedCategoriesSorted: expectedCategoriesSorted.map(([cat, _]) => cat),
        unexpectedSeries: unexpectedSeries,
        unexpectedSeriesMax: unexpectedSeriesMax,
        unexpectedCategoriesSorted: unexpectedCategoriesSorted.map(([cat, _]) => cat),
    };
}
