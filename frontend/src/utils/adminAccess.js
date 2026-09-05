import { ROLES, STAFF_ROLES } from '../constants/roles';

export const isSuperAdminRole = (role) => role === ROLES.SUPER_ADMIN;

export const isStaffRole = (role) => STAFF_ROLES.includes(role);

export const canApprove = (role) => isSuperAdminRole(role);

export const canSeeFinance = (role) => isSuperAdminRole(role);

export const canManageStaff = (role) => isSuperAdminRole(role);

export const canAssignVendor = (role) => isSuperAdminRole(role);

export function useAdminAccess(user) {
  const role = user?.role;
  return {
    role,
    isSuperAdmin: isSuperAdminRole(role),
    isStaff: isStaffRole(role),
    canApprove: canApprove(role),
    canSeeFinance: canSeeFinance(role),
    canManageStaff: canManageStaff(role),
    canAssignVendor: canAssignVendor(role),
  };
}
