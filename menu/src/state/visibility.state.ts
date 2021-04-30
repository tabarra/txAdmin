import {atom, useRecoilValue, useSetRecoilState} from "recoil";

const visibilityState = atom<boolean>({
  default: false,
  key: 'menuVisibility'
})

export const useIsMenuVisible = () => useRecoilValue(visibilityState)

export const useSetIsMenuVisible = () => useSetRecoilState(visibilityState)