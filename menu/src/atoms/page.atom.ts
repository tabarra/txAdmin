import {atom, useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";

export enum txAdminMenuPage {
  Main,
  Players,
  txAdmin,
}

const pageAtom = atom<txAdminMenuPage>({
  default: 0,
  key: 'menuPage'
})

export const usePage = () => useRecoilState(pageAtom)

export const useSetPage = () => useSetRecoilState(pageAtom)

export const usePageValue = () => useRecoilValue(pageAtom)