import { resolveListingStatus } from './listingApproval.js';
import { resolvePublicUrl } from '../services/storageService.js';

/** Shared vendor "my listings" payload: { id, name, slug, prices, image, isActive, approvalStatus }. */

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const minOf = (values) => {
  const nums = values.map(num).filter((v) => v != null);
  return nums.length ? Math.min(...nums) : null;
};

const coverOf = (doc, extra) => {
  const rooms = Array.isArray(doc?.rooms) ? doc.rooms : [];
  const roomPhoto = rooms.find((room) => room?.images?.[0])?.images?.[0];
  return doc?.images?.[0] || doc?.photo || doc?.imageUrl || roomPhoto || extra || '';
};

export const toMineListing = (doc, prices, extraImage) => ({
  id: String(doc._id),
  name: doc.name,
  slug: doc.slug || null,
  prices,
  image: resolvePublicUrl(coverOf(doc, extraImage)) || null,
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
    from: num(doc.priceFrom) ?? num(doc.priceRangeFrom) ?? minOf(roomPrices),
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

export const mapHotelMine = (doc, minRoomPrice, roomImage) =>
  toMineListing(doc, {
    from: num(minRoomPrice) ?? num(doc.priceRangeFrom) ?? num(doc.priceRangeTo),
  }, roomImage);
