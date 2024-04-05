import { PlayersTableFiltersType, PlayersTableSearchType } from "@shared/playerApiTypes";

export const defaultSearch: NonNullable<PlayersTableSearchType> = {
    value: '',
    type: 'playerName'
};

export const defaultFilters: PlayersTableFiltersType = [];