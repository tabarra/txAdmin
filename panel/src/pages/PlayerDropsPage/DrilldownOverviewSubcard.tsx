import { useMemo } from "react";
import { dropReasonCategories } from "../Dashboard/PlayerDropCard";
import { numberToLocaleString } from "@/lib/utils";
import { PlayerDropsMessage } from "./PlayerDropsGenericSubcards";

type DisplayCategoryDataType = {
    label: string;
    color: string;
    count: number;
}

type DrilldownOverviewSubcardProps = {
    dropTypes: [string, number][];
};

export default function DrilldownOverviewSubcard({ dropTypes }: DrilldownOverviewSubcardProps) {
    let { totalDrops, categories } = useMemo(() => {
        let totalDrops = 0;
        const categories: Record<string, DisplayCategoryDataType> = {};
        for (const [cat, cnt] of dropTypes) {
            totalDrops += cnt;
            if (!(cat in dropReasonCategories)) continue;
            categories[cat] = {
                label: dropReasonCategories[cat].label,
                color: dropReasonCategories[cat].color,
                count: cnt,
            };
        }
        return {
            totalDrops,
            categories: Object.entries(categories),
        };
    }, [dropTypes]);

    if (!categories.length) {
        return <PlayerDropsMessage message="No player drops within this time window." />;
    }

    return (
        <div className="px-4 py-2 flex flex-wrap justify-evenly gap-4 text-muted-foreground">
            {categories.map(([reasonId, reasonData]) => (
                <div
                    key={reasonId}
                    className="px-4 flex flex-col gap-1 items-center justify-center"
                >
                    <span className="text-xl tracking-wider">{reasonData.label}</span>
                    {numberToLocaleString(reasonData.count)} ({numberToLocaleString((reasonData.count / totalDrops) * 100, 1)}%)
                </div>
            ))}
        </div>
    );
}
