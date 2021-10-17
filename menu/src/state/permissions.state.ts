import { atom, useRecoilValue, useSetRecoilState } from "recoil";

// TODO: Make an enum
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
  | "control.server"
  | "server.cfg.editor"
  | "settings.view"
  | "settings.write"
  | "txadmin.log.view"
  | "menu.vehicle"
  | "menu.clear_area"
  | "players.spectate"
  | "players.troll"
  | "players.freeze";

export interface PermCheckServerResp {
  isAdmin: boolean;
  permissions?: ResolvablePermission[];
  expiration?: number;
  luaToken: string;
  logout?: boolean;
}

const permissionState = atom<PermCheckServerResp>({
  key: "permissionsState",
  default: null,
});

export const usePermissionsValue = () => useRecoilValue(permissionState);

export const useSetPermissions = () => useSetRecoilState(permissionState);
