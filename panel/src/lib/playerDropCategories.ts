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

//0.8 is best for light mode, and 2 is best for dark mode, comrpomise at 1.4
const borderDarkerRatio = 1.4;
const border = (base: string) => color(base)!.darker(borderDarkerRatio).toString();

enum BaseColors {
    Default = '#A97CD2',
    Green = '#39E673',
    Blue = '#406FE6',
    Cream = '#F0E38B',
    Orange = '#FF913F',
    Red = '#FF3E26',
    Purple = '#F13BF7',
}

export const playerDropCategoryDefaultColor = BaseColors.Default;
export const playerDropCategories: PlayerDropCategoriesType = {
    player: {
        label: 'Player',
        color: BaseColors.Green,
        border: border(BaseColors.Green),
        expected: true,
    },
    resource: {
        label: 'Resource',
        color: BaseColors.Blue,
        border: border(BaseColors.Blue),
        expected: true,
    },
    timeout: {
        label: 'Timeout',
        color: BaseColors.Cream,
        border: border(BaseColors.Cream),
        expected: false,
    },
    crash: {
        label: 'Crash',
        color: BaseColors.Orange,
        border: border(BaseColors.Orange),
        expected: false,
    },
    security: {
        label: 'Security',
        color: BaseColors.Red,
        border: border(BaseColors.Red),
        expected: false,
    },
    unknown: {
        label: 'Unknown',
        color: BaseColors.Purple,
        border: border(BaseColors.Purple),
        expected: false,
    },
};

export const playerDropExpectedCategories = Object.keys(playerDropCategories)
    .filter((catId) => playerDropCategories[catId].expected);
export const playerDropUnexpectedCategories = Object.keys(playerDropCategories)
    .filter((catId) => !playerDropCategories[catId].expected);
