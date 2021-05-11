import { atom, useRecoilValue, useSetRecoilState } from "recoil";

const tabState = atom({
  key: 'tabKeysDisabledState',
  default: false,
})

export const useSetDisableTab = () => useSetRecoilState(tabState)

export const useTabDisabledValue = () => useRecoilValue(tabState)