import { atom, useSetAtom } from "jotai";
import { PerfSnapType } from "./chartingUtils";
import { DashboardDataEventType, DashboardPleyerDropDataType, DashboardSvRuntimeDataType } from "@shared/socketioTypes";


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
