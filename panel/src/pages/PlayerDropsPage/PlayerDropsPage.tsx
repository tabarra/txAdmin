import { useBackendApi } from "@/hooks/fetch";
import type { PlayerDropsApiResp, PlayerDropsApiSuccessResp } from "@shared/otherTypes";
import useSWR from "swr";
import DrilldownCard, { DrilldownCardLoading } from "./DrilldownCard";
import TimelineCard from "./TimelineCard";


export default function PlayerDropsPage() {
    const playerDropsApi = useBackendApi<PlayerDropsApiResp>({
        method: 'GET',
        path: `/playerDropsData`,
    });

    const swrDataApiResp = useSWR('/playerDropsData', async () => {
        const data = await playerDropsApi({});
        if (!data) throw new Error('empty_response');
        if ('fail_reason' in data) {
            throw new Error(data.fail_reason);
        }
        return data as PlayerDropsApiSuccessResp;
    }, {});

    return (
        <div className="w-full space-y-8">
            <TimelineCard
                isError={!!swrDataApiResp.error}
                summaryData={swrDataApiResp.data?.summary}
            />

            {swrDataApiResp.data ? (
                <DrilldownCard
                    windowStart={swrDataApiResp.data.detailed.windowStart}
                    windowEnd={swrDataApiResp.data.detailed.windowEnd}
                    windowData={swrDataApiResp.data.detailed.windowData}
                />
            ) : (
                <DrilldownCardLoading isError={!!swrDataApiResp.error} />
            )}
        </div>
    );
}
