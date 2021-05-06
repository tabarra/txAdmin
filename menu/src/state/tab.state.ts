import { atom, useRecoilValue, useSetRecoilState } from "recoil";

const tabState = atom({
  key: 'tabKeysDisabledState',
  default: false
})

export const useSetTabState = () => useSetRecoilState(tabState)

export const useTabStateValue = () => useRecoilValue(tabState)