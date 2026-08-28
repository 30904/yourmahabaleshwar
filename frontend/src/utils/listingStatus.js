export const listingStatusOf = (doc) => {
  if (!doc) return 'PENDING';
  if (doc.isActive !== false) return 'APPROVED';
  const stored = String(doc.approvalStatus || '').toUpperCase();
  if (stored === 'REJECTED' || stored === 'APPROVED') return 'REJECTED';
  return 'PENDING';
};

export const listingStatusBadgeColor = (status) => {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  return 'warning';
};

export const listingStatusI18nKey = (status) => {
  if (status === 'APPROVED') return 'vendor.listingApproved';
  if (status === 'REJECTED') return 'vendor.listingRejected';
  return 'vendor.listingPending';
};

const APPROVAL_GATED_VERTICALS = new Set(['HOTEL', 'RESORT', 'HOMESTAY', 'TENT', 'HORSE', 'GUIDE', 'TAXI', 'DRIVER']);

export const canVendorEditListing = (item) => {
  const vertical = String(item?.vertical || item?.listingType || '').toUpperCase();
  if (!APPROVAL_GATED_VERTICALS.has(vertical)) return true;
  return listingStatusOf(item) === 'APPROVED';
};
