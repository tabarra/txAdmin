import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";

const visibilityState = atom<boolean>({
  default: false,
  key: "menuVisibility",
});

export const useIsMenuVisibleValue = () => useRecoilValue(visibilityState);

export const useSetIsMenuVisible = () => useSetRecoilState(visibilityState);

export const useIsMenuVisible = () => useRecoilState(visibilityState);
