import { isListingAdmin } from './vendorListingAccess.js';
import { ROLES, STAFF_ROLES } from '../constants/roles.js';

export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const resolveListingStatus = (doc) => {
  if (doc?.isActive !== false) return APPROVAL_STATUS.APPROVED;
  const stored = String(doc?.approvalStatus || '').toUpperCase();
  if (stored === APPROVAL_STATUS.REJECTED || stored === APPROVAL_STATUS.APPROVED) {
    return APPROVAL_STATUS.REJECTED;
  }
  return APPROVAL_STATUS.PENDING;
};

/** Vendors may change listing details only after superadmin approval. */
export const denyIfVendorCannotEdit = (req, doc) => {
  if (isListingAdmin(req.user) || STAFF_ROLES.includes(req.user?.role)) return null;
  if (resolveListingStatus(doc) !== APPROVAL_STATUS.APPROVED) {
    return { status: 403, message: 'Listing can be edited only after it is approved' };
  }
  return null;
};

/** Vendor-created stay listings wait for superadmin before going live. */
export const stampPendingIfVendor = (req, data) => {
  if (req.user?.role === ROLES.SUPER_ADMIN) return data;
  return { ...data, isActive: false, approvalStatus: APPROVAL_STATUS.PENDING };
};

export const approvalFilter = (status) => {
  if (status === 'approved' || status === 'active') return { isActive: { $ne: false } };
  if (status === 'pending') {
    return { isActive: false, approvalStatus: { $nin: [APPROVAL_STATUS.REJECTED] } };
  }
  if (status === 'rejected') return { approvalStatus: APPROVAL_STATUS.REJECTED };
  if (status === 'inactive') return { isActive: false };
  return {};
};
