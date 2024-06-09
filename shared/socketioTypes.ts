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

    //Standalone events
    updateAvailable: (event: UpdateAvailableEventType) => void
};
