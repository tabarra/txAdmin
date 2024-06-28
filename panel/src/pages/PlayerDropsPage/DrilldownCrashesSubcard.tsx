import { useMemo } from "react";
import { cn, numberToLocaleString } from "@/lib/utils";
import { PlayerDropsMessage } from "./PlayerDropsGenericSubcards";

type DrilldownCrashesSubcardProps = {
    crashTypes: [string, number][];
};

export default function DrilldownCrashesSubcard({ crashTypes }: DrilldownCrashesSubcardProps) {
    const totalCrashes = useMemo(() => {
        return crashTypes.reduce((acc, [, cnt]) => acc + cnt, 0);
    }, [crashTypes]);

    if (!crashTypes.length) {
        return <PlayerDropsMessage message="No player crashes within this time window." />;
    }

    return (
        <table className="px-4 pt-2">
            <thead>
                <tr className="border-b text-muted-foreground/75">
                    <th className="min-w-[8ch] px-2 py-1 border-r text-right">%</th>
                    <th className="min-w-[8ch] px-2 py-1 border-r text-right">Count</th>
                    <th className="px-2 py-1">Crash Reason</th>
                </tr>
            </thead>
            <tbody>
                {crashTypes.map(([crashType, count], index) => (
                    <tr
                        key={crashType}
                        className={cn(
                            index < crashTypes.length - 1 ? 'border-b' : '',
                            index % 2 && 'bg-secondary/15',
                            'hover:bg-secondary/35'
                        )}
                    >
                        <td className="min-w-[8ch] px-2 py-1 border-r text-right" title="% of all crashes">
                            {numberToLocaleString((count / totalCrashes) * 100, 1)}%
                        </td>
                        <td className="min-w-[8ch] px-2 py-1 border-r text-right" title="crash count">
                            {numberToLocaleString(count)}
                        </td>
                        <td className="px-2 py-1">
                            {crashType}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
