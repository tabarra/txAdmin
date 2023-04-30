export type DatabasePlayerType = {
    license: string;
    ids: string[];
    hwids: string[];
    displayName: string;
    pureName: string;
    playTime: number;
    tsLastConnection: number;
    tsJoined: number;
    tsWhitelisted?: number;
    notes?: {
        text: string;
        lastAdmin: string | null;
        tsLastEdit: number | null;
    };
};
export type DatabaseActionType = {
    id: string;
    type: 'ban' | 'warn';
    ids: string[];
    hwids?: string[]; //used only in bans
    playerName: string | false;
    reason: string;
    author: string;
    timestamp: number;
    expiration: number | false;
    revocation: {
        timestamp: number | null;
        author: string | null;
    };
};
export type DatabaseWhitelistApprovalsType = {
    identifier: string;
    playerName: string; //always filled, even with `unknown` or license `xxxxxx...xxxxxx` 
    playerAvatar: string | null,
    tsApproved: number,
    approvedBy: string
};
export type DatabaseWhitelistRequestsType = {
    id: string, //R####
    license: string,
    playerDisplayName: string,
    playerPureName: string,
    discordTag?: string,
    discordAvatar?: string, //first try to get from GuildMember, then client.users.fetch()
    tsLastAttempt: number,
};

export type DatabaseDataType = {
    version: number,
    players: DatabasePlayerType[],
    actions: DatabaseActionType[],
    whitelistApprovals: DatabaseWhitelistApprovalsType[],
    whitelistRequests: DatabaseWhitelistRequestsType[],
};
