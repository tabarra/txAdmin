import { atom, useRecoilValue, useSetRecoilState } from "recoil";

export type ResolvablePermission =
  | "all_permissions"
  | "manage.admins"
  | "commands.resources"
  | "players.playermode"
  | "players.teleport"
  | "players.heal"
  | "players.trollmenu"
  | "players.ban"
  | "players.kick"
  | "players.message"
  | "players.warn"
  | "players.whitelist"
  | "console.view"
  | "console.write"
  | 'control.server'
  | "server.cfg.editor"
  | "settings.view"
  | "settings.write"
  | "txadmin.log.view"
  | "menu.vehicle";

export interface PermCheckServerResp {
  isAdmin: boolean;
  permission?: ResolvablePermission[];
  expiration?: number;
}

const permissionState = atom<PermCheckServerResp>({
  key: "permissionsState",
  default: {
    isAdmin: false
  },
});

export const usePermissionsValue = () => useRecoilValue(permissionState);

export const useSetPermissions = () => useSetRecoilState(permissionState);
