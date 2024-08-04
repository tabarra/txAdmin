import { useBackendApi } from "@/hooks/fetch";
import type { PlayerDropsApiResp, PlayerDropsApiSuccessResp } from "@shared/otherTypes";
import useSWRImmutable from "swr/immutable";
import DrilldownCard, { DrilldownCardLoading } from "./DrilldownCard";
import TimelineCard from "./TimelineCard";
import { useEffect, useState } from "react";

export type DrilldownRangeSelectionType = {
    startDate: Date;
    endDate: Date;
} | null;
export type DisplayLodType = 'hour' | 'day';

export default function PlayerDropsPage() {
    const [displayLod, setDisplayLod] = useState<DisplayLodType>('hour');
    const [drilldownRange, setDrilldownRange] = useState<DrilldownRangeSelectionType>(null);
    const playerDropsApi = useBackendApi<PlayerDropsApiResp>({
        method: 'GET',
        path: `/playerDropsData`,
    });

    const swrDataApiResp = useSWRImmutable('/playerDropsData', async () => {
        const queryParams = drilldownRange ? {
            detailedWindow: `${drilldownRange.startDate.toISOString()},${drilldownRange.endDate.toISOString()}`
        } : undefined;
        const data = await playerDropsApi({ queryParams });
        if (!data) throw new Error('empty_response');
        if ('fail_reason' in data) {
            throw new Error(data.fail_reason);
        }
        return data as PlayerDropsApiSuccessResp;
    }, {});
    useEffect(() => {
        swrDataApiResp.mutate();
    }, [drilldownRange]);
    useEffect(() => {
        setDrilldownRange(null);
    }, [displayLod]);

    return (
        <div className="w-full space-y-8">
            <TimelineCard
                isError={!!swrDataApiResp.error}
                summaryData={swrDataApiResp.data?.summary}
                rangeSelected={drilldownRange}
                rangeSetter={setDrilldownRange}
                displayLod={displayLod}
                setDisplayLod={setDisplayLod}
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
