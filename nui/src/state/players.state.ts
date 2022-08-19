import {
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import { VehicleStatus, PlayerData } from "../hooks/usePlayerListListener";
import { debugData } from "../utils/debugData";

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
              player.name.toLowerCase().includes(formattedInput) ||
              player.id.toString().includes(formattedInput)
          )
        : unfilteredPlayerStates;

      switch (sortType) {
        case PlayerDataSort.DistanceClosest:
          // Since our distance can come back as -1 when unknown, we need to explicitly
          // move to the end of the sorted array.
          return [...playerStates].sort((a, b) => {
            if (b.dist < 0) return -1;
            if (a.dist < 0) return 1;

            return a.dist > b.dist ? 1 : -1;
          });
        case PlayerDataSort.DistanceFarthest:
          return [...playerStates].sort((a, b) => (a.dist < b.dist ? 1 : -1));
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
      action: "setPlayerList",
      data: [
        {
          vType: VehicleStatus.Walking,
          name: "Chip",
          id: 1,
          dist: 0,
          health: 80,
          admin: false,
        },
        {
          vType: VehicleStatus.Driving,
          name: "Taso",
          id: 2,
          dist: 20,
          health: 50,
          admin: true,
        },
        {
          vType: VehicleStatus.Boat,
          name: "Tabarra",
          id: 3,
          dist: 700,
          health: 10,
          admin: true,
        },
        {
          vType: VehicleStatus.Boat,
          name: "Death",
          id: 4,
          dist: 100,
          health: 100,
          admin: false,
        },
        {
          vType: VehicleStatus.Unknown,
          name: "Death",
          id: 5,
          dist: -1,
          health: 70,
          admin: false,
        },
        {
          vType: VehicleStatus.Walking,
          name: "Death",
          id: 6,
          dist: 500,
          health: 100,
          admin: false,
        },
        {
          vType: VehicleStatus.Biking,
          name: "Death",
          id: 7,
          dist: 300,
          health: 40,
          admin: false,
        },
        {
          vType: VehicleStatus.Boat,
          name: "Death",
          id: 8,
          dist: -1,
          health: 40,
          admin: false,
        },
        {
          vType: VehicleStatus.Boat,
          name: "Death",
          id: 9,
          dist: -1,
          health: 40,
          admin: false,
        },
        {
          vType: VehicleStatus.Boat,
          name: "Death",
          id: 10,
          dist: 50,
          health: 40,
          admin: false,
        },
        {
          vType: VehicleStatus.Boat,
          name: "Death",
          id: 11,
          dist: 90,
          health: 40,
          admin: false,
        },
        {
          vType: VehicleStatus.Boat,
          name: "Death",
          id: 12,
          dist: 500,
          health: 40,
          admin: false,
        },
        {
          vType: VehicleStatus.Boat,
          name: "Death",
          id: 13,
          dist: 500,
          health: 40,
          admin: false,
        },
        {
          vType: VehicleStatus.Boat,
          name: "Death",
          id: 14,
          dist: 500,
          health: 40,
          admin: false,
        },
        {
          vType: VehicleStatus.Boat,
          name: "Death",
          id: 15,
          dist: 500,
          health: 40,
          admin: false,
        },
        {
          vType: VehicleStatus.Boat,
          name: "Death",
          id: 16,
          dist: 500,
          health: 40,
          admin: false,
        },
      ],
    },
  ],
  3000
);

function mockData() {
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
      dist: randomDist,
      health: 100,
      name: randomUsername,
      vType: randomStatus,
    });
  }

  console.log(playerData);

  return playerData;
}
