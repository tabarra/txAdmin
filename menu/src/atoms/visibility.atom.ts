import {atom, useRecoilValue, useSetRecoilState} from "recoil";

const visibilityAtom = atom<boolean>({
  default: process.env.NODE_ENV === 'development',
  key: 'menuVisibility'
})

export const useIsMenuVisible = () => useRecoilValue(visibilityAtom)

export const useSetIsMenuVisible = () => useSetRecoilState(visibilityAtom)