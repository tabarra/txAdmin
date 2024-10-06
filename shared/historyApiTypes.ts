import { DatabaseActionType } from "@core/components/PlayerDatabase/databaseTypes";
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


export type HistoryTableSearchType = {
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
    isRevoked: boolean;
    banExpiration?: 'expired' | 'active' | 'permanent';
    warnAcked?: boolean;
}

export type HistoryTableSearchResp = {
    history: HistoryTableActionType[];
    hasReachedEnd: boolean;
} | GenericApiErrorResp;


export type HistoryActionModalSuccess = {
    serverTime: number; //required to calculate if bans have expired on frontend
    action: DatabaseActionType;
}
export type HistoryActionModalResp = HistoryActionModalSuccess | GenericApiErrorResp;
