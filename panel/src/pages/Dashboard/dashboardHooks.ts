import { atom, useAtomValue, useSetAtom } from "jotai";
import { PerfSnapType } from "./chartingUtils";
import { DashboardDataEventType, DashboardPleyerDropDataType, DashboardSvRuntimeDataType } from "@shared/socketioTypes";
import { throttle } from "throttle-debounce";
import { useCallback } from "react";


/**
 * Types
 */
type DashboardPerfCursorDataType = {
    threadName: string;
    snap: PerfSnapType;
};
type DashboardServerStatsDataType = {
    uptimePct?: number;
    medianPlayerCount?: number;
};


/**
 * Atoms
 */
export const dashPlayerDropAtom = atom<DashboardPleyerDropDataType | undefined>(undefined);
export const dashServerStatsAtom = atom<DashboardServerStatsDataType | undefined>(undefined);
export const dashSvRuntimeAtom = atom<DashboardSvRuntimeDataType | undefined>(undefined);
export const dashPerfCursorAtom = atom<DashboardPerfCursorDataType | undefined>(undefined);
export const dashDataTsAtom = atom<number>(0);
const dataMaxAge = 2.5 * 60 * 1000; //2.5 minutes


/**
 * Hooks
 */
export const useSetDashboardData = () => {
    const setPlayerDrop = useSetAtom(dashPlayerDropAtom);
    const setSvRuntime = useSetAtom(dashSvRuntimeAtom);
    const setDataTs = useSetAtom(dashDataTsAtom);

    return (eventData: DashboardDataEventType) => {
        setPlayerDrop(eventData.playerDrop);
        setSvRuntime(eventData.svRuntime);
        setDataTs(Date.now());
    };
};

export const useThrottledSetCursor = () => {
    const setCursor = useSetAtom(dashPerfCursorAtom);
    const debouncedCursorSetter = useCallback(
        throttle(150, setCursor, { noLeading: false, noTrailing: false }),
        [setCursor]
    );
    return debouncedCursorSetter;
};

export const usePushPlayerDropEvent = () => {
    const setPlayerDrop = useSetAtom(dashPlayerDropAtom);
    return (category: string) => {
        setPlayerDrop((prev) => {
            if (!prev) return prev;
            const newSummary = prev.summaryLast6h.slice();
            const categoryIndex = newSummary.findIndex(([c]) => c === category);
            if (categoryIndex === -1) {
                newSummary.push([category, 1]);
            } else {
                newSummary[categoryIndex][1]++;
            }
            return {
                ...prev,
                summaryLast6h: newSummary,
            };
        });
    };
}

export const useGetDashDataAge = () => {
    const dataTs = useAtomValue(dashDataTsAtom);
    return () => {
        const now = Date.now();
        return {
            isExpired: now - dataTs > dataMaxAge,
            isStale: now - dataTs > 60 * 1000,
            age: now - dataTs
        };
    };
};
