import { PermCheckServerResp, ResolvablePermission } from '../state/permissions.state';
import { TxAdminActionRespType } from '../components/PlayerModal/Tabs/DialogActionView';
import { VariantType } from 'notistack';

export const userHasPerm = (perm: ResolvablePermission, permsState: PermCheckServerResp): boolean => {
  const userPerms = permsState.permissions || []
  return (userPerms).includes(perm) || (userPerms).includes('all_permissions')
}

export const formatDistance = (distance: number): string => {
  let unit = 'm'
  let roundedDistance = (distance * 1000) / 1000;
  if (roundedDistance > 1000) {
    roundedDistance = roundedDistance / 1000;
    unit = 'km'
  }
  return `${roundedDistance.toLocaleString()} ${unit}`
}

const lookupTable: Record<string, VariantType> = {
  success: 'success',
  danger: 'error',
  warning: 'warning'
}
export const translateAlertType = (txAdminType: TxAdminActionRespType): VariantType => lookupTable[txAdminType]