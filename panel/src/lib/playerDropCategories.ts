import { color } from "d3";

export type PlayerDropCategoryType = {
    label: string;
    color: string;
    border: string;
    expected: boolean;
};
type PlayerDropCategoriesType = {
    [key: string]: PlayerDropCategoryType;
};

// const borderDarkerRatio = 0.8;
// const borderDarkerRatio = 1.4;
const borderDarkerRatio = 2;
export const playerDropCategoryDefaultColor = '#A97CD2';
export const playerDropCategories: PlayerDropCategoriesType = {
    //FIXME: replace with "player-initiated" 
    'user-initiated': {
        label: 'Player',
        color: '#39E673', //green
        border: color('#39E673')!.darker(borderDarkerRatio).toString(),
        expected: true,
    },
    unknown: {
        label: 'Resource',
        color: '#406FE6', //blue
        border: color('#406FE6')!.darker(borderDarkerRatio).toString(),
        expected: true,
    },
    timeout: {
        label: 'Timeout',
        color: '#F0E38B', // Creme
        border: color('#F0E38B')!.darker(borderDarkerRatio).toString(),
        expected: false,
    },
    crash: {
        label: 'Crash',
        color: '#FF913F', //Laranja
        border: color('#FF913F')!.darker(borderDarkerRatio).toString(),
        expected: false,
    },
    security: {
        label: 'Security',
        color: '#FF3E26', //Vermelho
        border: color('#FF3E26')!.darker(borderDarkerRatio).toString(),
        expected: false,
    },
    'server-initiated': {
        label: 'Unknown',
        color: '#F13BF7', //Roxo
        border: color('#F13BF7')!.darker(borderDarkerRatio).toString(),
        expected: false,
    },
};

export const playerDropExpectedCategories = Object.keys(playerDropCategories)
    .filter((catId) => playerDropCategories[catId].expected);
export const playerDropUnexpectedCategories = Object.keys(playerDropCategories)
    .filter((catId) => !playerDropCategories[catId].expected);
