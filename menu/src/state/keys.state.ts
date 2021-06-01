import { atom, useRecoilValue, useSetRecoilState } from "recoil";

const tabState = atom({
  key: "tabKeysDisabledState",
  default: false,
});

// setter - Disable tab nav
export const useSetDisableTab = () => useSetRecoilState(tabState);
// value - disable tab nav
export const useTabDisabledValue = () => useRecoilValue(tabState);

const listenForExitState = atom({
  key: "listenForExitState",
  default: true,
});
// setter - Listen for ESC/Delete keys
export const useSetListenForExit = () => useSetRecoilState(listenForExitState);

// value - Listen for ESC/Delete keys
export const useListenForExitValue = () => useRecoilValue(listenForExitState);
