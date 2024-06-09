import { atom, useAtom } from "jotai";
import { PerfSnapType } from "./chartingUtils";


/**
 * Types
 */
type DashboardPerfCursorData = {
    threadName: string;
    snap: PerfSnapType;
    boundaries: (number | '+Inf')[];
};


/**
 * Atoms
 */
export const dashboardPerfCursorAtom = atom<DashboardPerfCursorData | undefined>(undefined);

