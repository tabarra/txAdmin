import { GenericApiErrorResp } from "genericApiTypes";

export type HistoryStatsResp = {
    totalWarns: number;
    warnsLast7d: number;
    totalBans: number;
    bansLast7d: number;
    groupedByAdmins: {
        name: string;
        actions: number;
    }[];
} | GenericApiErrorResp;


export type HistoryTableSearchType = null | {
    value: string;
    type: string;
}

export type HistoryTableSortingType = {
    key: 'timestamp';
    desc: boolean;
};

export type HistoryTableReqType = {
    search: HistoryTableSearchType;
    filterbyType: string | undefined;
    filterbyAdmin: string | undefined;
    sorting: HistoryTableSortingType;
    //NOTE: the query needs to be offset.param inclusive, but offset.actionId exclusive
    // therefore, optimistically always limit to x + 1
    offset?: {
        param: number;
        actionId: string;
    }
};

export type HistoryTableActionType = {
    id: string;
    type: "ban" | "warn";
    playerName: string | false;
    author: string;
    reason: string;
    timestamp: number;
    isExpired: boolean;
    isRevoked: boolean;
}

export type HistoryTableSearchResp = {
    history: HistoryTableActionType[];
    hasReachedEnd: boolean;
} | GenericApiErrorResp;
