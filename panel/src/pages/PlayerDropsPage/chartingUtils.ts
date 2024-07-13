import { PlayerDropsSummaryHour } from "@shared/otherTypes";
import { playerDropAtypicalCategories, playerDropTypicalCategories } from "@/lib/playerDropCategories";
import { TimelineDropsDatum } from "./drawDropsTimeline";

export type PlayerDropsCategoryCount = [category: string, count: number];

/**
 * Processes the player drops summary api data to return the data for the timeline chart.
 * 
 * OBJECTIVES:
 * 1. separate typical and atypical drops
 * 2. get max drops per typical/atypical category to size the Y axis'
 * 3. sort the typical/atypical category by cumulative drops for displaying in consistent order
 */
export const processDropsSummary = (apiData: PlayerDropsSummaryHour[], selectedPeriod: string, windowStart: Date) => {
    const tsWindowStart = windowStart.getTime();
    const windowStartIndex = apiData.findIndex(hourData => (new Date(hourData.hour)).getTime() >= tsWindowStart);
    const windowData = apiData.slice(windowStartIndex);
    //FIXME: consider the selectedPeriod for the time range

    //Separate typical and atypical drops so we can sort the categories by total drops
    const typicalCategoriesDropsTotal = Object.fromEntries(playerDropTypicalCategories.map(cat => [cat, 0]));
    const atypicalCategoriesDropsTotal = Object.fromEntries(playerDropAtypicalCategories.map(cat => [cat, 0]));

    //Get the max drops per category to size the Y axis
    let typicalSeriesMax = 0;
    let atypicalSeriesMax = 0;
    let crashesSeriesMax = 0;

    //Process the data
    const series = [];
    for (const hourData of windowData) {
        const typicalDrops: PlayerDropsCategoryCount[] = [];
        const atypicalDrops: PlayerDropsCategoryCount[] = [];
        let hourTypicalTotalDrops = 0;
        let hourAtypicalTotalDrops = 0;
        // let hourTotalDrops = 0;
        for (const [catName, catCount] of hourData.dropTypes) {
            // hourTotalDrops += catCount;
            // if (catName === 'crash') continue; //ignore crashes (they are in a separate series)
            if (playerDropTypicalCategories.includes(catName)) {
                hourTypicalTotalDrops += catCount;
                typicalDrops.push([catName, catCount]);
                typicalCategoriesDropsTotal[catName] += catCount;
            } else {
                hourAtypicalTotalDrops += catCount;
                atypicalDrops.push([catName, catCount]);
                atypicalCategoriesDropsTotal[catName] += catCount;
            }
        }
        typicalSeriesMax = Math.max(typicalSeriesMax, hourTypicalTotalDrops);
        atypicalSeriesMax = Math.max(atypicalSeriesMax, hourAtypicalTotalDrops);
        crashesSeriesMax = Math.max(crashesSeriesMax, hourData.crashes);
        series.push({
            // hasChanges: hourData.hasChanges,
            // hourTotalDrops,
            typicalDrops,
            atypicalDrops,
            crashes: hourData.crashes,
        });
    }

    //Sort categories by total drops
    const typicalCategoriesSorted = Object.entries(typicalCategoriesDropsTotal)
        .sort((a, b) => b[1] - a[1]);
    const typicalCategoriesOrder = Object.fromEntries(
        typicalCategoriesSorted.map(([cat, _], index) => [cat, index])
    );
    const atypicalCategoriesSorted = Object.entries(atypicalCategoriesDropsTotal)
        .sort((a, b) => b[1] - a[1]);
    const atypicalCategoriesOrder = Object.fromEntries(
        atypicalCategoriesSorted.map(([cat, _], index) => [cat, index])
    );



    //Separate the series and sort drops by category
    const typicalSeries: TimelineDropsDatum[] = [];
    const atypicalSeries: TimelineDropsDatum[] = [];
    const crashSeries: TimelineDropsDatum[] = [];
    for (let i = 0; i < windowData.length; i++) {
        const hourData = windowData[i];
        const seriesData = series[i];
        const currHour = new Date(hourData.hour);

        typicalSeries.push({
            hour: currHour,
            // ratio: seriesData.hourTotalDrops / typicalSeriesMax,
            drops: seriesData.typicalDrops.sort(([aCat], [bCat]) => {
                return typicalCategoriesOrder[aCat] - typicalCategoriesOrder[bCat];
            }),
        });
        atypicalSeries.push({
            hour: currHour,
            // ratio: seriesData.hourTotalDrops / atypicalSeriesMax,
            drops: seriesData.atypicalDrops.sort(([aCat], [bCat]) => {
                return atypicalCategoriesOrder[aCat] - atypicalCategoriesOrder[bCat];
            }),
        });
        crashSeries.push({
            hour: currHour,
            // ratio: seriesData.crashes / crashesSeriesMax,
            drops: [['crash', seriesData.crashes]],
        });
    }

    return {
        //FIXME: rename to expected and unexpected?
        typicalSeries,
        typicalSeriesMax,
        typicalCategoriesSorted: typicalCategoriesSorted.map(([cat, _]) => cat),

        atypicalSeries,
        atypicalSeriesMax,
        atypicalCategoriesSorted: atypicalCategoriesSorted.map(([cat, _]) => cat),

        //FIXME: join the crash one?
        crashSeries,
        crashesSeriesMax,

        //FIXME: drop this?
        groupsMaxDrops: Math.max(typicalSeriesMax, atypicalSeriesMax, crashesSeriesMax), //so all charts have the same height
    };
}


