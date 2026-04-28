import { ROLES, MANAGEMENT_ROLES, EDITOR_ROLES } from '../constants/roles';

export const hasRole = (userRole, allowedRoles) => {
  if (!userRole) return false;
  if (!Array.isArray(allowedRoles)) {
    return userRole === allowedRoles;
  }
  return allowedRoles.includes(userRole);
};

export const isManagement = (role) => hasRole(role, MANAGEMENT_ROLES);
export const isEditor = (role) => hasRole(role, EDITOR_ROLES);
export const isSuperUser = (role) => role === ROLES.SUPERUSER;
export const isHR = (role) => role === ROLES.HR;
