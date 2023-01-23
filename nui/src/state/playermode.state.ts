import { atom, useRecoilState } from "recoil";

export enum PlayerMode {
  DEFAULT = "none",
  NOCLIP = "noclip",
  GOD_MODE = "godmode",
  SUPER_JUMP = "superjump",
}

const playermodeState = atom({
  key: "playerModeState",
  default: PlayerMode.DEFAULT,
});

export const usePlayerMode = () => useRecoilState(playermodeState);
