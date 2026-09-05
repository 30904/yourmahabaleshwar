import { ROLES } from '../constants/roles.js';

export const isListingAdmin = (user) => user?.role === ROLES.SUPER_ADMIN;

/** Guide, taxi, driver, horse vendors may own only one listing each. */
export const SINGLE_LISTING_VENDOR_ROLES = [
  ROLES.GUIDE,
  ROLES.TAXI_OPERATOR,
  ROLES.DRIVER,
  ROLES.HORSE_OPERATOR,
];

export const isSingleListingVendor = (role) => SINGLE_LISTING_VENDOR_ROLES.includes(role);

/** Returns { status, message } if this vendor already has a listing, else null. */
export const denyIfSingleListingExceeded = async (req, Model, ownerField) => {
  if (!isSingleListingVendor(req.user?.role)) return null;
  const count = await Model.countDocuments({ [ownerField]: req.user._id });
  if (count >= 1) {
    return {
      status: 400,
      message: 'You can create only one listing. Edit your existing listing instead.',
    };
  }
  return null;
};

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
    delete next.renewalPrice;
  }
  return next;
};
