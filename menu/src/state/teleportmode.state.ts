import { atom, useRecoilState } from "recoil";

export enum TeleportMode {
  WAYPOINT = "waypoint",
  COORDINATES = "coords",
  PREVIOUS = "previous",
  COPY = "copy",
}

const teleportMode = atom({
  key: "teleportModeState",
  default: TeleportMode.WAYPOINT,
});

export const useTeleportMode = () => useRecoilState(teleportMode);
