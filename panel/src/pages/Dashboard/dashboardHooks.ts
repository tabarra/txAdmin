import { atom, useAtom } from "jotai";
import { PerfSnapType } from "./chartingUtils";


/**
 * Types
 */
type DashboardPerfCursorData = {
    threadName: string;
    snap: PerfSnapType;
};


/**
 * Atoms
 */
export const dashboardPerfCursorAtom = atom<DashboardPerfCursorData | undefined>(undefined);

