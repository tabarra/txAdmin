import { useMemo } from "react";
import { numberToLocaleString } from "@/lib/utils";
import { PlayerDropsMessage } from "./PlayerDropsGenericSubcards";

type DisplayResourceDatum = {
    label: string;
    count: number;
}

type DrilldownResourcesSubcardProps = {
    resKicks: [string, number][];
};

export default function DrilldownResourcesSubcard({ resKicks }: DrilldownResourcesSubcardProps) {
    let { totalKicks, resources } = useMemo(() => {
        let totalKicks = 0;
        const resources: Record<string, DisplayResourceDatum> = {};
        for (const [resName, cnt] of resKicks) {
            totalKicks += cnt;
            resources[resName] = {
                label: resName,
                count: cnt,
            };
        }
        return {
            totalKicks,
            resources: Object.entries(resources),
        };
    }, [resKicks]);

    if (!resources.length) {
        return <PlayerDropsMessage message="No players kicked by resources within this time window." />;
    }

    return (
        <div className="px-4 py-4 flex flex-wrap justify-evenly gap-4 text-muted-foreground">
            {resources.map(([resName, resData]) => (
                <div
                    key={resName}
                    className="px-4 flex flex-col gap-1 items-center justify-center"
                >
                    <span className="text-lg tracking-wider border-b-2">{resData.label}</span>
                    <span className="text-sm">
                        {numberToLocaleString(resData.count)} <small className="opacity-75">({numberToLocaleString((resData.count / totalKicks) * 100, 1)}%)</small>
                    </span>
                </div>
            ))}
        </div>
    );
}
