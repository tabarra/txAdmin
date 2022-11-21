import { atom, useRecoilState } from "recoil";

export enum VehicleMode {
  SPAWN = "spawn",
  FIX = "fix",
  DELETE = "delete",
  BOOST = "boost",
}

const vehicleMode = atom({
  key: "vehicleModeState",
  default: VehicleMode.SPAWN,
});

export const useVehicleMode = () => useRecoilState(vehicleMode);
