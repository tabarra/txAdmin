import { atom, useRecoilState } from "recoil";

const playermodeState = atom({
  key: 'playerModeState',
  default: null
})

export const usePlayerMode = () => useRecoilState(playermodeState)