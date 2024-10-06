import { useMemo } from "react";
import { cn, numberToLocaleString } from "@/lib/utils";
import { PlayerDropsMessage } from "./PlayerDropsGenericSubcards";
import { compressMultipleCounter, splitPrefixedStrings } from "./utils";


type CrashDatumData = {
    key: string;
    pctStr: string;
    cntStr: string;
    prefix: string | false;
    suffix: string;
};

type CrashTypeRowProps = {
    datum: CrashDatumData;
    isOdd: boolean;
    isLast: boolean;
};

function CrashTypeRow({ datum, isLast, isOdd }: CrashTypeRowProps) {
    let dataCellNode = null;
    if (datum.prefix) {
        dataCellNode = <>
            <span className="text-muted-foreground/50">{datum.prefix}</span>
            <span>{datum.suffix}</span>
        </>
    } else {
        dataCellNode = datum.suffix;
    }

    return (
        <tr
            className={cn(
                'font-mono text-sm group',
                !isLast && 'border-b',
                isOdd && 'bg-secondary/15',
                'hover:bg-secondary/35'
            )}
        >
            <td className="min-w-[4ch] px-2 py-1 border-r text-right" title="Percent of all crashes">
                {datum.pctStr ?? '--'}
            </td>
            <td className="min-w-[4ch] px-2 py-1 border-r text-right" title="Crash count">
                {datum.cntStr ?? '--'}
            </td>
            <td className="px-2 py-1 break-words line-clamp-4">
                {dataCellNode}
            </td>
        </tr>
    );
}


type DrilldownCrashesSubcardProps = {
    crashTypes: [reasonType: string, count: number][];
    crashesGroupReasons: boolean;
    crashesTargetLimit: number;
    setCrashesTargetLimit: (limit: number) => void;
};

export default function DrilldownCrashesSubcard({
    crashTypes,
    crashesGroupReasons,
    crashesTargetLimit,
    setCrashesTargetLimit
}: DrilldownCrashesSubcardProps) {
    if (!crashTypes.length) {
        return <PlayerDropsMessage message="No player crashes within this time window." />;
    }

    const crashesData = useMemo(() => {
        //Sort the data - the default api sort is by count (NOTE: we are mutating the array)
        if (crashesGroupReasons) {
            crashTypes.sort((a, b) => a[0].localeCompare(b[0]));
        } else {
            crashTypes.sort((a, b) => b[1] - a[1]);
        }

        //Calculate the total crashes and compress the data
        const totalCrashes = crashTypes.reduce((acc, [, cnt]) => acc + cnt, 0);
        const { filteredIn, filteredOut } = crashesTargetLimit
            ? compressMultipleCounter(crashTypes, crashesTargetLimit, crashesGroupReasons)
            : { filteredIn: crashTypes, filteredOut: false as const };
        const processedStrings = splitPrefixedStrings(filteredIn.map(([str, cnt]) => str));

        //Prepare the display data
        const display: CrashDatumData[] = [];
        let displayCrashCount = 0;
        for (let i = 0; i < filteredIn.length; i++) {
            const [crashType, crashCount] = filteredIn[i];
            displayCrashCount += crashCount;
            const fraction = (crashCount / totalCrashes);
            display.push({
                key: crashType,
                pctStr: numberToLocaleString(fraction * 100, 1) + '%',
                cntStr: numberToLocaleString(crashCount),
                ...processedStrings[i],
            });
        }
        return {
            display,
            displayPct: numberToLocaleString((displayCrashCount / totalCrashes) * 100, 1) + '%',
            filteredOut: filteredOut && {
                ...filteredOut,
                countPct: numberToLocaleString((filteredOut.count / totalCrashes) * 100, 1) + '%',
            }
        };

    }, [crashTypes, crashesGroupReasons, crashesTargetLimit, setCrashesTargetLimit]);

    return (
        <table className="w-full px-4 pt-2">
            <thead>
                <tr className="border-b text-muted-foreground/75">
                    <th className="min-w-[4ch] px-2 py-1 border-r text-right">%</th>
                    <th className="min-w-[4ch] px-2 py-1 border-r text-right">Count</th>
                    <th className="px-2 py-1">Crash Reason</th>
                </tr>
            </thead>
            <tbody>
                {crashesData.display.map((datum, index) => (
                    <CrashTypeRow
                        key={datum.key}
                        datum={datum}
                        isOdd={index % 2 === 0}
                        isLast={!crashesData.filteredOut && index === crashesData.display.length - 1}
                    />
                ))}
                {crashesData.filteredOut ? (
                    <tr>
                        <td
                            colSpan={3}
                            className={cn(
                                'text-center px-4 py-2 text-muted-foreground',
                                crashesData.display.length % 2 === 0 && 'bg-secondary/15',
                                'hover:bg-secondary/35'
                            )}
                        >
                            Showing the top {crashesData.display.length} out of {numberToLocaleString(crashTypes.length)} reasons which account for {crashesData.displayPct} of all crashes. <br />
                            The remaining {numberToLocaleString(crashesData.filteredOut.types)} reasons account for {crashesData.filteredOut.countPct} of all crashes. {' '}
                            <button
                                className="text-accent hover:underline"
                                onClick={() => setCrashesTargetLimit(0)}
                            >
                                Show All!
                            </button>
                        </td>
                    </tr>
                ) : null}
            </tbody>
        </table>
    );
}
