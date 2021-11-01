import { ResolvablePermission } from "../state/permissions.state";
import { TxAdminActionRespType } from "../components/PlayerModal/Tabs/DialogActionView";
import { VariantType } from "notistack";

export const userHasPerm = (
  perm: ResolvablePermission,
  permsState: ResolvablePermission[]
): boolean => {
  const userPerms = permsState ?? [];
  return userPerms.includes(perm) || userPerms.includes("all_permissions");
};

export const formatDistance = (distance: number): string => {
  let unit = "m";
  let roundedDistance = Math.round(distance);
  if (roundedDistance >= 1000) {
    roundedDistance = +(roundedDistance / 1000).toFixed(1);
    unit = "km";
  }
  return `${roundedDistance.toLocaleString()} ${unit}`;
};

export const arrayRandom = <T>(arr: T[]): T => {
  return arr[Math.round(Math.random() * (arr.length - 1))];
};

const lookupTable: Record<string, VariantType> = {
  success: "success",
  danger: "error",
  warning: "warning",
};
export const translateAlertType = (
  txAdminType: TxAdminActionRespType
): VariantType => lookupTable[txAdminType];

/**
 * Returns whether we are in browser or in NUI
 **/
export const isBrowserEnv = (): boolean => !(window as any).invokeNative
