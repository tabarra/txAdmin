import { useMemo } from "react";
import { cn, numberToLocaleString } from "@/lib/utils";
import { PlayerDropsMessage } from "./PlayerDropsGenericSubcards";
import { compressMultipleCounter, splitPrefixedStrings } from "./utils";


type CrashTypeData = {
    key: string;
    pctStr: string;
    cntStr: string;
    prefix: string | false;
    suffix: string;
};
type CrashGroupData = {
    key: string;
    pctStr: number | null;
    cntStr: number | null;
    subgroup: CrashTypeData[];
};
type CrashDatumData = CrashTypeData | CrashGroupData;


type CrashTypeRowProps = {
    datum: CrashDatumData;
    isOdd: boolean;
    isLast: boolean;
};

function CrashTypeRow({ datum, isLast, isOdd }: CrashTypeRowProps) {
    let dataCellNode = null;
    if ('subgroup' in datum) {
        dataCellNode = (
            <>
                <div className="block group-hover:hidden">
                    <span className="text-info-inline">
                        {datum.subgroup.length}x
                    </span> {' '}
                    <span className="text-warning-inline">
                        {datum.key}
                    </span>
                </div>
                <div className="hidden group-hover:block">
                    {datum.subgroup.map((crash) => (
                        <p>
                            <span className="text-muted-foreground/50">{crash.prefix}</span>
                            <span>{crash.suffix}</span>
                        </p>
                    ))}
                </div>
            </>
        );
    } else {
        if (datum.prefix) {
            dataCellNode = <>
                <span className="text-muted-foreground/50">{datum.prefix}</span>
                <span>{datum.suffix}</span>
            </>
        } else {
            dataCellNode = datum.suffix;
        }
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
    crashTypes: [string, number][];
    crashesTargetLimit: number;
    setCrashesTargetLimit: (limit: number) => void;
};

export default function DrilldownCrashesSubcard({
    crashTypes,
    crashesTargetLimit,
    setCrashesTargetLimit
}: DrilldownCrashesSubcardProps) {
    if (!crashTypes.length) {
        return <PlayerDropsMessage message="No player crashes within this time window." />;
    }

    const crashesData = useMemo(() => {
        const totalCrashes = crashTypes.reduce((acc, [, cnt]) => acc + cnt, 0);
        const { filteredIn, filteredOut } = crashesTargetLimit
            ? compressMultipleCounter(crashTypes, crashesTargetLimit)
            : { filteredIn: crashTypes, filteredOut: false as const };
        const processedStrings = splitPrefixedStrings(filteredIn.map(([str, cnt]) => str));

        const display: CrashDatumData[] = [];
        let displayCrashCount = 0;
        for (let index = 0; index < filteredIn.length; index++) {
            const [crashType, crashCount] = filteredIn[index];
            displayCrashCount += crashCount;
            display.push({
                key: crashType,
                pctStr: numberToLocaleString((crashCount / totalCrashes) * 100, 1) + '%',
                cntStr: numberToLocaleString(crashCount),
                ...processedStrings[index],
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

    }, [crashTypes, crashesTargetLimit, setCrashesTargetLimit]);

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
