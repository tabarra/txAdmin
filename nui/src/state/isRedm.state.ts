import { atom, useRecoilState, useRecoilValue } from "recoil";

const isRedmState = atom({
  key: 'isRedm',
  default: false,
});
export const useIsRedmValue = () => useRecoilValue(isRedmState);
export const useIsRedm = () => useRecoilState(isRedmState);
