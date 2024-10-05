import { color } from "d3";

export type PlayerDropCategoryType = {
    label: string;
    description: string;
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
        description: 'Player left by quitting the game, leaving the server or other normal means.',
        color: BaseColors.Green,
        border: border(BaseColors.Green),
        expected: true,
    },
    resource: {
        label: 'Resource',
        description: 'Player kicked out of the server by a resource.',
        color: BaseColors.Blue,
        border: border(BaseColors.Blue),
        expected: true,
    },
    timeout: {
        label: 'Timeout',
        description: 'Player connection timed out due to networking issues or client crash.',
        color: BaseColors.Cream,
        border: border(BaseColors.Cream),
        expected: false,
    },
    crash: {
        label: 'Crash',
        description: 'Player left due to a game crash, but was still able to inform the server the crash reason.',
        color: BaseColors.Orange,
        border: border(BaseColors.Orange),
        expected: false,
    },
    security: {
        label: 'Security',
        description: 'Player kicked out of the server due to suspect behavior such as sending too many commands or losing connection to the Cfx.re backend services.',
        color: BaseColors.Red,
        border: border(BaseColors.Red),
        expected: false,
    },
    unknown: {
        label: 'Unknown',
        description: 'Player left the server for an unknown reason.',
        color: BaseColors.Purple,
        border: border(BaseColors.Purple),
        expected: false,
    },
};

export const playerDropExpectedCategories = Object.keys(playerDropCategories)
    .filter((catId) => playerDropCategories[catId].expected);
export const playerDropUnexpectedCategories = Object.keys(playerDropCategories)
    .filter((catId) => !playerDropCategories[catId].expected);
