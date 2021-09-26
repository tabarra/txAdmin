import {
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import { debugData } from "../utils/debugData";

export enum VehicleStatus {
  Unknown = "unknown",
  Walking = "walking",
  Driving = "driving",
  Flying = "flying", //planes or heli
  Boat = "boating",
  Biking = "biking",
}

export type PlayerData = Required<PlayerDataPartial> & { id: number };
export type PlayerDataSetPartial = { [serverID: string]: PlayerDataPartial };

export interface PlayerDataPartial {
  id: number;
  vehicleStatus: VehicleStatus;
  distance: number;
  health?: number;
  username?: string;
  license?: string;
}

export enum PlayerDataSort {
  IdJoinedFirst = "idJoinedFirst",
  IdJoinedLast = "idJoinedLast",
  DistanceClosest = "distanceClosest",
  DistanceFarthest = "distanceFarthest",
}

const playersState = {
  playerData: atom<PlayerData[]>({
    default: [],
    key: "playerStates",
  }),
  playerSortType: atom<PlayerDataSort | null>({
    default: PlayerDataSort.IdJoinedFirst,
    key: "playerSortType",
  }),
  sortedAndFilteredPlayerData: selector({
    key: "sortedAndFilteredPlayerStates",
    get: ({ get }) => {
      const sortType: PlayerDataSort = get(playersState.playerSortType);
      const filteredValueInput = get(playersState.filterPlayerDataInput);
      const unfilteredPlayerStates = get(playersState.playerData);

      const formattedInput = filteredValueInput.trim().toLowerCase();

      const playerStates: PlayerData[] = filteredValueInput
        ? unfilteredPlayerStates.filter(
          (player) =>
            player.username.toLowerCase().includes(formattedInput) ||
            player.id.toString().includes(formattedInput)
        )
        : unfilteredPlayerStates;

      switch (sortType) {
        case PlayerDataSort.DistanceClosest:
          return [...playerStates].sort((a, b) =>
            a.distance > b.distance ? 1 : -1
          );
        case PlayerDataSort.DistanceFarthest:
          return [...playerStates].sort((a, b) =>
            a.distance < b.distance ? 1 : -1
          );
        case PlayerDataSort.IdJoinedFirst:
          return [...playerStates].sort((a, b) => (a.id > b.id ? 1 : -1));
        case PlayerDataSort.IdJoinedLast:
          return [...playerStates].sort((a, b) => (a.id < b.id ? 1 : -1));
        default:
          return playerStates;
      }
    },
  }),
  filterPlayerDataInput: atom({
    key: "filterPlayerDataInput",
    default: "",
  }),
  // If true, player data filter will reset on page switch
  filterPlayerDataIsTemp: atom({
    key: "filterPlayerDataIsTemp",
    default: false,
  }),
};

export const usePlayersState = () => useRecoilValue(playersState.playerData);

export const useSetPlayersState = () =>
  useSetRecoilState(playersState.playerData);

export const useSetPlayerFilter = () =>
  useSetRecoilState(playersState.filterPlayerDataInput);

export const useSetPlayersFilterIsTemp = () =>
  useSetRecoilState(playersState.filterPlayerDataIsTemp);

export const usePlayersSortedValue = () =>
  useRecoilValue(playersState.sortedAndFilteredPlayerData);

export const usePlayersSortBy = () =>
  useRecoilState(playersState.playerSortType);

export const usePlayersFilter = () =>
  useRecoilState(playersState.filterPlayerDataInput);

export const usePlayersFilterIsTemp = () =>
  useRecoilState(playersState.filterPlayerDataIsTemp);

export const useFilteredSortedPlayers = (): PlayerData[] =>
  useRecoilValue(playersState.sortedAndFilteredPlayerData);

debugData<PlayerData[]>(
  [
    {
      action: "setPlayerState",
      data: [
        {
          vehicleStatus: VehicleStatus.Walking,
          username: "Chip",
          id: 1,
          distance: 500,
          health: 80,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Driving,
          username: "Taso",
          id: 2,
          distance: 500,
          health: 50,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Boat,
          username: "Tabarra",
          id: 3,
          distance: 500,
          health: 10,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Boat,
          username: "Death",
          id: 4,
          distance: 500,
          health: 100,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Unknown,
          username: "Death",
          id: 5,
          distance: 500,
          health: 70,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Walking,
          username: "Death",
          id: 6,
          distance: 500,
          health: 100,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Biking,
          username: "Death",
          id: 7,
          distance: 500,
          health: 40,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Boat,
          username: "Death",
          id: 8,
          distance: 500,
          health: 40,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Boat,
          username: "Death",
          id: 9,
          distance: 500,
          health: 40,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Boat,
          username: "Death",
          id: 10,
          distance: 500,
          health: 40,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Boat,
          username: "Death",
          id: 11,
          distance: 500,
          health: 40,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Boat,
          username: "Death",
          id: 12,
          distance: 500,
          health: 40,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Boat,
          username: "Death",
          id: 13,
          distance: 500,
          health: 40,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Boat,
          username: "Death",
          id: 14,
          distance: 500,
          health: 40,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Boat,
          username: "Death",
          id: 15,
          distance: 500,
          health: 40,
          license: "3333333333333333333333deadbeef0000nosave",
        },
        {
          vehicleStatus: VehicleStatus.Boat,
          username: "Death",
          id: 16,
          distance: 500,
          health: 40,
          license: "3333333333333333333333deadbeef0000nosave",
        },
      ],
    },
  ],
  3000
);

function mockData () {
  const randomUsernames = [
    "hamy",
    "taso",
    "tabarra",
    "hype",
    "chip",
    "goat",
    "siege",
    "wowjesus",
    "noodles",
    "plok",
    "kiwi",
    "monke",
  ];

  const MAX_PLAYERS = 500;
  const playerData: PlayerData[] = [];
  const statuses: VehicleStatus[] = [
    VehicleStatus.Biking,
    VehicleStatus.Boat,
    VehicleStatus.Unknown,
    VehicleStatus.Unknown,
    VehicleStatus.Walking,
  ];

  for (let i = 0; i < MAX_PLAYERS; i++) {
    const randomDist = Math.random() * 5000;
    const randomUsername =
      randomUsernames[Math.floor(Math.random() * randomUsernames.length)];
    const randomStatusIdx = Math.floor(Math.random() * 5);
    const randomStatus = statuses[randomStatusIdx];

    playerData.push({
      id: i + 1,
      distance: randomDist,
      health: 100,
      license: "licensething",
      username: randomUsername,
      vehicleStatus: randomStatus,
    });
  }

  console.log(playerData);

  return playerData;
}
