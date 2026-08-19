import { ROLES } from '../constants/roles.js';

export const isListingAdmin = (user) => user?.role === ROLES.SUPER_ADMIN;

/** Returns { status, message } to send, or null if the user may mutate the doc. */
export const denyIfNotOwner = (req, doc, ownerField) => {
  if (!doc) return { status: 404, message: 'Not found' };
  if (isListingAdmin(req.user)) return null;
  if (!ownerField || String(doc[ownerField]) !== String(req.user._id)) {
    return { status: 403, message: 'Forbidden' };
  }
  return null;
};

export const stampOwnerOnCreate = (req, data, ownerField) => {
  const next = { ...data };
  if (!isListingAdmin(req.user)) {
    next[ownerField] = req.user._id;
  } else if (!next[ownerField]) {
    next[ownerField] = req.user._id;
  }
  return next;
};

export const stripOwnerOnUpdate = (req, data, ownerField) => {
  const next = { ...data };
  if (!isListingAdmin(req.user)) {
    delete next[ownerField];
    delete next.isActive;
    delete next.approvalStatus;
    delete next.commissionRate;
  }
  return next;
};
