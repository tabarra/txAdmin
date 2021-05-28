import { PermCheckServerResp, ResolvablePermission } from '../state/permissions.state';

export const userHasPerm = (perm: ResolvablePermission, permsState: PermCheckServerResp): boolean => {
  const userPerms = permsState.permissions || []
  return (userPerms).includes(perm) || (userPerms).includes('all_permissions')
}