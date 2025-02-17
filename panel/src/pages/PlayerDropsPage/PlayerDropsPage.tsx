import { useBackendApi } from "@/hooks/fetch";
import type { PlayerDropsApiResp, PlayerDropsApiSuccessResp } from "@shared/otherTypes";
import useSWR from "swr";
import DrilldownCard, { DrilldownCardLoading } from "./DrilldownCard";
import TimelineCard from "./TimelineCard";
import { useState } from "react";

export type DrilldownRangeSelectionType = {
    startDate: Date;
    endDate: Date;
} | null;
export type DisplayLodType = 'hour' | 'day';


/**
 * Get the query params for the player drops api
 * Modifies the end date to include the whole day/hour depending on the display LOD
 */
const getQueryParams = (rangeState: DrilldownRangeSelectionType, displayLod: DisplayLodType) => {
    if (!rangeState) {
        const detailedDaysAgo = displayLod === 'day' ? 14 : 7;
        return {
            queryKey: 'detailedDaysAgo=' + detailedDaysAgo,
            queryParams: { detailedDaysAgo }
        };
    }

    const newEndDate = new Date(rangeState.endDate);
    if (displayLod === 'day') {
        newEndDate.setHours(23, 59, 59, 999);
    } else {
        newEndDate.setMinutes(59, 59, 999);
    }
    const detailedWindow = `${rangeState.startDate.toISOString()},${newEndDate.toISOString()}`;
    return {
        queryKey: 'detailedWindow=' + detailedWindow,
        queryParams: { detailedWindow }
    };
}


/**
 * The player drops page
 */
export default function PlayerDropsPage() {
    const [displayLod, setDisplayLod] = useState<DisplayLodType>('hour');
    const [drilldownRange, setDrilldownRange] = useState<DrilldownRangeSelectionType>(null);
    const { queryKey, queryParams } = getQueryParams(drilldownRange, displayLod);

    const playerDropsApi = useBackendApi<PlayerDropsApiResp>({
        method: 'GET',
        path: `/playerDropsData`,
    });
    const swrDataApiResp = useSWR(`/playerDropsData?${queryKey}`, async () => {
        const data = await playerDropsApi({ queryParams });
        if (!data) throw new Error('empty_response');
        if ('fail_reason' in data) {
            throw new Error(data.fail_reason);
        }
        return data as PlayerDropsApiSuccessResp;
    },{
        revalidateOnFocus: false,
    });
    const displayLodSetter = (lod: DisplayLodType) => {
        setDisplayLod(lod);
        setDrilldownRange(null);
    }

    return (
        <div className="w-full space-y-8">
            <TimelineCard
                isError={!!swrDataApiResp.error}
                dataTs={swrDataApiResp.data?.ts}
                summaryData={swrDataApiResp.data?.summary}
                rangeSelected={drilldownRange}
                rangeSetter={setDrilldownRange}
                displayLod={displayLod}
                setDisplayLod={displayLodSetter}
            />

            {swrDataApiResp.data && !swrDataApiResp.isValidating ? (
                <DrilldownCard
                    windowStart={swrDataApiResp.data.detailed.windowStart}
                    windowEnd={swrDataApiResp.data.detailed.windowEnd}
                    windowData={swrDataApiResp.data.detailed.windowData}
                    rangeSelected={drilldownRange}
                    displayLod={displayLod}
                />
            ) : (
                <DrilldownCardLoading isError={!!swrDataApiResp.error} />
            )}
        </div>
    );
}
