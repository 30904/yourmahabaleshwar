import { resolveListingStatus } from './listingApproval.js';

/** Shared vendor "my listings" payload: { id, name, slug, prices, isActive, approvalStatus }. */

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const minOf = (values) => {
  const nums = values.map(num).filter((v) => v != null);
  return nums.length ? Math.min(...nums) : null;
};

export const toMineListing = (doc, prices) => ({
  id: String(doc._id),
  name: doc.name,
  slug: doc.slug || null,
  prices,
  isActive: doc.isActive !== false,
  approvalStatus: resolveListingStatus(doc),
});

export const mapTentMine = (doc) =>
  toMineListing(doc, {
    from: num(doc.pricePerNight),
    perNight: num(doc.pricePerNight),
  });

export const mapGuideMine = (doc) =>
  toMineListing(doc, {
    from: minOf([doc.package6hr, doc.package12hr]),
    package6hr: num(doc.package6hr),
    package12hr: num(doc.package12hr),
    bikeAddonPrice: num(doc.bikeAddonPrice),
  });

export const mapDriverMine = (doc) =>
  toMineListing(doc, {
    from: minOf([doc.perTripPrice, doc.hourlyRate]),
    perTrip: num(doc.perTripPrice),
    hourly: num(doc.hourlyRate),
  });

export const mapHomestayMine = (doc) => {
  const roomPrices = (doc.rooms || []).map((r) => r.basePrice);
  return toMineListing(doc, {
    from: num(doc.priceFrom) ?? minOf(roomPrices),
  });
};

export const mapHorseMine = (doc) => {
  const routePrices = (doc.routes || []).map((r) => r.price);
  return toMineListing(doc, {
    from: num(doc.priceFrom) ?? minOf(routePrices),
  });
};

export const mapProductMine = (doc) =>
  toMineListing(doc, {
    from: num(doc.price),
    price: num(doc.price),
    stock: num(doc.stock),
  });

export const mapHotelMine = (doc, minRoomPrice) =>
  toMineListing(doc, {
    from: num(minRoomPrice),
  });
