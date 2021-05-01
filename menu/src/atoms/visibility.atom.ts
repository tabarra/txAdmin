import {atom, useRecoilValue, useSetRecoilState} from "recoil";

const visibilityAtom = atom<boolean>({
  default: false,
  key: 'menuVisibility'
})

export const useIsMenuVisible = () => useRecoilValue(visibilityAtom)

export const useSetIsMenuVisible = () => useSetRecoilState(visibilityAtom)