import { atom, useRecoilState } from "recoil";

export enum PlayerIDsMode {
  ABOVE,
  MAP,
}

const playerIds = atom({
  key: "playerIdsState",
  default: PlayerIDsMode.ABOVE,
});

export const usePlayerIdsMode = () => useRecoilState(playerIds);