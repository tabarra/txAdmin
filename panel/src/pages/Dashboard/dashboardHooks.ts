import { atom, useSetAtom } from "jotai";
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


/**
 * Atoms
 */
export const dashPlayerDropAtom = atom<DashboardPleyerDropDataType | undefined>(undefined);
export const dashSvRuntimeAtom = atom<DashboardSvRuntimeDataType | undefined>(undefined);
export const dashPerfCursorAtom = atom<DashboardPerfCursorDataType | undefined>(undefined);


/**
 * Hooks
 */
export const useSetDashboardData = () => {
    const setPlayerDrop = useSetAtom(dashPlayerDropAtom);
    const setSvRuntime = useSetAtom(dashSvRuntimeAtom);

    return (eventData: DashboardDataEventType) => {
        setPlayerDrop(eventData.playerDrop);
        setSvRuntime(eventData.svRuntime);
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
