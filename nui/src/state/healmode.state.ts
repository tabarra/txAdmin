import { atom, useRecoilState } from "recoil";

export enum HealMode {
  SELF,
  ALL,
}

const healMode = atom({
  key: "healModeState",
  default: HealMode.SELF,
});

export const useHealMode = () => useRecoilState(healMode);
