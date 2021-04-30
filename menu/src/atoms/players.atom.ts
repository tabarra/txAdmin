import {atom, useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";

export interface PlayerData {
  health: number;
  armor: number;
  inVehicle: boolean;
  id: number;
  distance: number;
  username: string;
}

const playersAtom = atom<PlayerData[]>({
  default: [],
  key: "playerStates",
});

export const usePlayersState = () => useRecoilValue(playersAtom)

export const useSetPlayersState = () => useSetRecoilState(playersAtom)