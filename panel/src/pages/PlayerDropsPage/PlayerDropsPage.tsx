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

export default function PlayerDropsPage() {
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

    return (
        <div className="w-full space-y-8">
            <TimelineCard
                isError={!!swrDataApiResp.error}
                summaryData={swrDataApiResp.data?.summary}
                rangeSelected={drilldownRange}
                rangeSetter={setDrilldownRange}
            />

            {swrDataApiResp.data && !swrDataApiResp.isValidating ? (
                <DrilldownCard
                    windowStart={swrDataApiResp.data.detailed.windowStart}
                    windowEnd={swrDataApiResp.data.detailed.windowEnd}
                    windowData={swrDataApiResp.data.detailed.windowData}
                    rangeSelected={drilldownRange}
                    rangeSetter={setDrilldownRange}
                />
            ) : (
                <DrilldownCardLoading isError={!!swrDataApiResp.error} />
            )}
        </div>
    );
}
