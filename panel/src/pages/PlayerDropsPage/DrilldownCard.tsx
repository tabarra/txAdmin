import { FolderOpenIcon, ShapesIcon, SkullIcon } from "lucide-react";
import { memo } from "react";
import type { PlayerDropsApiSuccessResp } from "@shared/otherTypes";
import { dateToLocaleDateString, dateToLocaleTimeString, isDateToday } from "@/lib/utils";
import DrilldownCrashesSubcard from "./DrilldownCrashesSubcard";
import DrilldownOverviewSubcard from "./DrilldownOverviewSubcard";
import { PlayerDropsLoadingSpinner } from "./PlayerDropsGenericSubcards";
import DrilldownChangesSubcard from "./DrilldownChangesSubcard";


export function DrilldownCardLoading({ isError }: { isError?: boolean }) {
    return (
        <div className="space-y-1">
            <div className="text-center space-x-2 text-sm text-muted-foreground">
                <span>Loading...</span>
            </div>
            <div className="pb-2 md:rounded-xl border bg-cardx shadow-sm flex flex-col">
                <div className="flex flex-col flex-shrink px-1 sm:px-4 py-2 space-y-4 border-b rounded-t-xl bg-secondary/35">
                    <div className="flex items-center space-x-2">
                        <div className='hidden xs:block'><FolderOpenIcon className="size-4" /></div>
                        <h2 className="font-mono text-sm">Overview</h2>
                    </div>
                </div>
                <div className="px-4 py-2 flex flex-wrap justify-evenly gap-4 text-muted-foreground">
                    <PlayerDropsLoadingSpinner isError={isError} />
                </div>
                <div className="flex flex-col flex-shrink px-1 sm:px-4 py-2 space-y-4 border-t border-b bg-secondary/35">
                    <div className="flex items-center space-x-2">
                        <div className='hidden xs:block'><SkullIcon className="size-4" /></div>
                        <h2 className="font-mono text-sm">Crash Reasons</h2>
                    </div>
                </div>
                <div className="px-4 pt-2 pb-4">
                    <PlayerDropsLoadingSpinner isError={isError} />
                </div>
                <div className="flex flex-col flex-shrink px-1 sm:px-4 py-2 space-y-4 border-t border-b bg-secondary/35">
                    <div className="flex items-center space-x-2">
                        <div className='hidden xs:block'><ShapesIcon className="size-4" /></div>
                        <h2 className="font-mono text-sm">Environment Changes</h2>
                    </div>
                </div>
                <div className="px-4 pt-2 pb-4 space-y-4">
                    <PlayerDropsLoadingSpinner isError={isError} />
                </div>
            </div>
        </div>
    );
}

type DrilldownCardProps = PlayerDropsApiSuccessResp['detailed'];

const DrilldownCardInner = function DrilldownCard({ windowStart, windowEnd, windowData }: DrilldownCardProps) {
    //Window indicator
    const doesWindowEndToday = isDateToday(new Date(windowEnd));
    const windowStartDate = new Date(windowStart);
    const windowStartTimeStr = dateToLocaleTimeString(windowStartDate, '2-digit', '2-digit');
    const windowStartDateStr = dateToLocaleDateString(windowStartDate, 'short');
    const windowStartStr = doesWindowEndToday ? windowStartTimeStr : `${windowStartTimeStr} - ${windowStartDateStr}`;
    const windowEndDate = new Date(windowEnd);
    const windowEndTimeStr = dateToLocaleTimeString(windowEndDate, '2-digit', '2-digit');
    const windowEndDateStr = dateToLocaleDateString(windowEndDate, 'short');
    const windowEndStr = doesWindowEndToday ? windowEndTimeStr : `${windowEndTimeStr} - ${windowEndDateStr}`;

    return (
        <div className="space-y-1">
            <div className="text-center space-x-2 text-sm text-muted-foreground">
                <span>Period from {windowStartStr} to {windowEndStr}.</span>
            </div>
            <div className="pb-2 md:rounded-xl border bg-cardx shadow-sm flex flex-col">
                <div className="">
                    <div className="flex flex-col flex-shrink px-1 sm:px-4 py-2 space-y-4 border-b rounded-t-xl bg-secondary/35">
                        <div className="flex items-center space-x-2">
                            <div className='hidden xs:block'><FolderOpenIcon className="size-4" /></div>
                            <h2 className="font-mono text-sm">Overview</h2>
                        </div>
                    </div>
                    <DrilldownOverviewSubcard dropTypes={windowData.dropTypes} />
                </div>

                <div className="pb-4">
                    <div className="flex flex-col flex-shrink px-1 sm:px-4 py-2 space-y-4 border-t border-b bg-secondary/35">
                        <div className="flex items-center space-x-2">
                            <div className='hidden xs:block'><ShapesIcon className="size-4" /></div>
                            <h2 className="font-mono text-sm">Environment Changes</h2>
                        </div>
                    </div>
                    <DrilldownChangesSubcard changes={windowData.changes} />
                </div>

                <div className="">
                    <div className="flex flex-col flex-shrink px-1 sm:px-4 py-2 space-y-4 border-t border-b bg-secondary/35">
                        <div className="flex items-center space-x-2">
                            <div className='hidden xs:block'><SkullIcon className="size-4" /></div>
                            <h2 className="font-mono text-sm">Crash Reasons</h2>
                        </div>
                    </div>
                    <DrilldownCrashesSubcard crashTypes={windowData.crashTypes} />
                </div>

            </div>
        </div>
    )
};

export default memo(DrilldownCardInner);
