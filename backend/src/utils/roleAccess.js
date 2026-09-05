import { ROLES, STAFF_ROLES } from '../constants/roles.js';

export const isSuperAdmin = (role) => role === ROLES.SUPER_ADMIN;

export const isStaffRole = (role) => STAFF_ROLES.includes(role);

export const canApprove = (role) => isSuperAdmin(role);

export const canSeeFinance = (role) => isSuperAdmin(role);

export const canManageStaff = (role) => isSuperAdmin(role);
