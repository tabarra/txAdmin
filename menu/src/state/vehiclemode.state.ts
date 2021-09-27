import { atom, useRecoilState } from "recoil";

export enum VehicleMode {
  SPAWN = "spawn",
  DELETE = "delete",
}

const vehicleMode = atom({
  key: "vehicleModeState",
  default: VehicleMode.SPAWN,
});

export const useVehicleMode = () => useRecoilState(vehicleMode);