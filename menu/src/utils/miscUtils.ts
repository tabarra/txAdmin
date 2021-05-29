import { PermCheckServerResp, ResolvablePermission } from '../state/permissions.state';
import { TxAdminActionRespType } from '../components/PlayerModal/Tabs/DialogActionView';
import { VariantType } from 'notistack';

export const userHasPerm = (perm: ResolvablePermission, permsState: PermCheckServerResp): boolean => {
  const userPerms = permsState.permissions || []
  return (userPerms).includes(perm) || (userPerms).includes('all_permissions')
}

const lookupTable: Record<string, VariantType> = {
  success: 'success',
  danger: 'error',
  warning: 'warning'
}
export const translateAlertType = (txAdminType: TxAdminActionRespType): VariantType => lookupTable[txAdminType]