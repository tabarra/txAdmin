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

const usePlayersState = () => useRecoilValue(playersAtom)

const useSetPlayersState = () => useSetRecoilState(playersAtom)