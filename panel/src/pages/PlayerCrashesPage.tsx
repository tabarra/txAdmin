import InlineCode from "@/components/InlineCode";
import { DndSortableGroup, DndSortableItem } from "@/components/dndSortable";
import { useBackendApi } from "@/hooks/fetch";
import { Loader2Icon } from "lucide-react";
import { PlayerCrashesApiResp } from "@shared/otherTypes";
import useSWR from "swr";
import { useState } from "react";

function CrashReasonCard({ reason, count, totalCrashes }: { reason: string, count: number, totalCrashes: number }) {
    const percentage = ((count / totalCrashes) * 100).toFixed(2);

    return (
        <div className="bg-card rounded-lg border px-2 py-3 flex gap-3 relative">
            <div className="flex-shrink-0 rounded-md px-3 py-1 m-auto text-sm font-medium bg-secondary text-secondary-foreground">
                <span>{count}</span>
                <span className="ml-1 ">({percentage}%)</span>
            </div>
            <p className="flex-1 text-sm ">
                {reason} lipsu
            </p>
        </div>
    )
}


export default function PlayerCrashesPage() {
    const playerCrashesApi = useBackendApi<PlayerCrashesApiResp>({
        method: 'GET',
        path: `/playerCrashesData`,
    });

    const swrDataApiResp = useSWR('/playerCrashesData', async () => {
        const data = await playerCrashesApi({});
        if (!data) throw new Error('empty_response');
        if ('fail_reason' in data) {
            throw new Error(data.fail_reason);
        }
        return data as [reason: string, count: number][];
    }, {});

    let totalCrashes = 0;
    if (swrDataApiResp.data) {
        console.log('asdfsfdgfsd');
        totalCrashes = swrDataApiResp.data?.reduce((acc, [, count]) => acc + count, 0) ?? 0
    }
    return <>
        <div className="space-y-4 w-full max-w-screen-lg mx-auto">
            <div className="px-2 md:px-0">
                <h1 className="text-3xl mb-2">Crash Reasons - last 24h</h1>
                <p>
                    Here you can see all the player crash reasons in the last 24 hours. <br />
                    This is useful for troubleshooting and solving bugs. <br />
                    <span className="text-muted-foreground italic">
                        NOTE: Some crash reasons might be missing due to players using translated game clients.<br />
                    </span>
                </p>
            </div>
            <div className="space-y-2">
                <div className="flex flex-wrap justify-between text-muted-foreground px-2 md:px-0">
                    <span className="shrink-0">Reasons: {swrDataApiResp.data?.length ?? 0}</span>
                    {swrDataApiResp.error ? (
                        <div className="inline-flex flex-wrap gap-1">
                            <span className='text-destructive-inline'>Error loading: {swrDataApiResp.error.message}</span>
                        </div>
                    ) : swrDataApiResp.isLoading || swrDataApiResp.isValidating ? (
                        <span className="text-muted-foreground">
                            Loading...
                        </span>
                    ) : null}
                </div>

                <div className="space-y-4">
                    {swrDataApiResp.data?.map(([reason, count]) => (
                        <CrashReasonCard
                            key={reason}
                            reason={reason}
                            count={count}
                            totalCrashes={totalCrashes}
                        />
                    ))}
                </div>
            </div>
        </div>
    </>;
}
