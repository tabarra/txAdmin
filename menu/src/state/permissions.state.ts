import { atom, useRecoilValue, useSetRecoilState } from "recoil";

export interface PermCheckServerResp {
  isAdmin: boolean;
  permission?: string[];
  expiration?: number;
}

const permissionState = atom<null | PermCheckServerResp>({
  key: "permissionsState",
  default: null,
});

export const usePermissionsValue = () => useRecoilValue(permissionState);

export const useSetPermissions = () => useSetRecoilState(permissionState);
