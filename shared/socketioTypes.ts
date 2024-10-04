import { SvRtPerfThreadNamesType } from "@core/components/StatsManager/svRuntime/config";
import { SvRtNodeMemoryType, SvRtPerfBoundariesType } from "@core/components/StatsManager/svRuntime/perfSchemas";
import type { ReactAuthDataType } from "authApiTypes";
import type { UpdateDataType } from "otherTypes";

/**
 * Status channel
 */
export type ServerConfigPendingStepType = 'setup' | 'deployer' | undefined;
export type GlobalStatusType = {
    discord: false | number;
    server: {
        configPendingStep: ServerConfigPendingStepType;
        status: string;
        process: string;
        instantiated: boolean;
        name: string;
        whitelist: "disabled" | "adminOnly" | "guildMember" | "guildRoles" | "approvedLicense";
    };
    scheduler: {
        nextRelativeMs: number;
        nextSkip: boolean;
        nextIsTemp: boolean;
    } | {
        nextRelativeMs: false;
        nextSkip: false;
        nextIsTemp: false;
    };
}


/**
 * Status channel
 */
export type DashboardSvRuntimeDataType = {
    fxsMemory?: number;
    nodeMemory?: SvRtNodeMemoryType;
    perfBoundaries?: SvRtPerfBoundariesType;
    perfBucketCounts?: {
        [key in SvRtPerfThreadNamesType]: number[];
    };
    perfMinTickTime: {
        [key in SvRtPerfThreadNamesType]: number;
    };
}
export type DashboardPleyerDropDataType = {
    summaryLast6h: [reasonCategory: string, count: number][];
};
export type DashboardDataEventType = {
    svRuntime: DashboardSvRuntimeDataType;
    playerDrop: DashboardPleyerDropDataType;
    // joinLeaveTally30m: {
    //     joined: number;
    //     left: number;
    // };
}


/**
 * Playerlist channel
 * TODO: apply those types to the playerlistManager
 */
export type FullPlayerlistEventType = {
    mutex: string | null,
    type: 'fullPlayerlist',
    playerlist: PlayerlistPlayerType[],
}

export type PlayerlistPlayerType = {
    netid: number,
    displayName: string,
    pureName: string,
    ids: string[],
    license: string | null,
}

export type PlayerDroppedEventType = {
    mutex: string,
    type: 'playerDropped',
    netid: number,
    reasonCategory?: string, //missing in case of server shutdown
}

export type PlayerJoiningEventType = {
    mutex: string,
    type: 'playerJoining',
} & PlayerlistPlayerType;


export type PlayerlistEventType = FullPlayerlistEventType | PlayerDroppedEventType | PlayerJoiningEventType;


/**
 * Standalone events (no room)
 */
export type UpdateAvailableEventType = {
    fxserver?: UpdateDataType;
    txadmin?: UpdateDataType;
}


/**
 * Listen Events Map
 */
export type ListenEventsMap = {
    error: (reason?: string) => void;
    logout: (reason?: string) => void;
    refreshToUpdate: () => void;
    status: (status: GlobalStatusType) => void;
    playerlist: (playerlistData: PlayerlistEventType[]) => void;
    updateAuthData: (authData: ReactAuthDataType) => void;
    consoleData: (data: string) => void;
    dashboard: (data: DashboardDataEventType) => void;

    //Standalone events
    updateAvailable: (event: UpdateAvailableEventType) => void
};
