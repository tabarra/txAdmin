import { HistoryTableSearchType } from "@shared/historyApiTypes";


export const defaultSearch: NonNullable<HistoryTableSearchType> = {
    value: '',
    type: 'actionId'
}

export const SEARCH_ANY_STRING = '!any';