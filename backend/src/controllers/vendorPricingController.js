import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import Tent from '../models/Tent.js';
import Guide from '../models/Guide.js';
import GuidePackage from '../models/GuidePackage.js';
import Driver from '../models/Driver.js';
import Homestay from '../models/Homestay.js';
import Horse from '../models/Horse.js';
import Product from '../models/Product.js';
import { success, error } from '../utils/apiResponse.js';
import { denyIfNotOwner } from '../utils/vendorListingAccess.js';
import {
  applyIfPresent,
  parseSeasonalPricing,
  positiveNumber,
  nonNegativeNumber,
} from '../utils/vendorPricing.js';
import {
  mapDriverMine,
  mapGuideMine,
  mapHomestayMine,
  mapHorseMine,
  mapHotelMine,
  mapProductMine,
  mapTentMine,
} from '../utils/vendorMineListings.js';

const loadOwned = async (Model, id, req, ownerField, type) => {
  const doc = await Model.findById(id);
  if (!doc) return { err: { status: 404, message: 'Not found' } };
  if (type && doc.type !== type) return { err: { status: 404, message: 'Not found' } };
  const denied = denyIfNotOwner(req, doc, ownerField);
  if (denied) return { err: denied };
  return { doc };
};

const fail = (res, err) => error(res, err.message, err.status || 400);

const patchStayPrices = (forcedType) => async (req, res) => {
  const loaded = await loadOwned(Hotel, req.params.id, req, 'vendor', forcedType);
  if (loaded.err) return fail(res, loaded.err);

  const roomsInput = req.body?.rooms;
  if (!Array.isArray(roomsInput) || !roomsInput.length) {
    return error(res, 'rooms array with prices is required', 400);
  }

  const updatedRooms = [];
  for (const row of roomsInput) {
    const roomId = row.id || row._id;
    if (!roomId) return error(res, 'Each room needs an id', 400);
    const room = await Room.findOne({ _id: roomId, hotel: loaded.doc._id });
    if (!room) return error(res, 'Room not found on this listing', 404);

    const hasBase = row.basePrice !== undefined;
    const hasSeasonal = row.seasonalPricing !== undefined;
    if (!hasBase && !hasSeasonal) {
      return error(res, 'Each room needs basePrice or seasonalPricing', 400);
    }

    if (row.basePrice !== undefined) {
      const parsed = positiveNumber(row.basePrice, 'basePrice');
      if (parsed.error) return error(res, parsed.error, 400);
      room.basePrice = parsed.value;
    }
    const seasonal = parseSeasonalPricing(row.seasonalPricing);
    if (seasonal.error) return error(res, seasonal.error, 400);
    if (!seasonal.skip) room.seasonalPricing = seasonal.value;

    await room.save();
    updatedRooms.push(room);
  }

  const minFrom = Math.min(...updatedRooms.map((r) => r.basePrice));
  const allRooms = await Room.find({ hotel: loaded.doc._id }).select('basePrice');
  const from = allRooms.length ? Math.min(...allRooms.map((r) => r.basePrice)) : minFrom;
  return success(res, {
    ...mapHotelMine(loaded.doc, from),
    rooms: updatedRooms.map((room) => ({
      id: String(room._id),
      name: room.name,
      basePrice: room.basePrice,
      seasonalPricing: room.seasonalPricing || [],
    })),
  });
};

export const patchHotelPrices = patchStayPrices('HOTEL');
export const patchResortPrices = patchStayPrices('RESORT');

export const patchTentPrices = async (req, res) => {
  const loaded = await loadOwned(Tent, req.params.id, req, 'operator');
  if (loaded.err) return fail(res, loaded.err);
  const parsed = positiveNumber(req.body?.pricePerNight, 'pricePerNight');
  if (parsed.error) return error(res, parsed.error, 400);
  loaded.doc.pricePerNight = parsed.value;
  await loaded.doc.save();
  return success(res, mapTentMine(loaded.doc));
};

export const patchGuidePrices = async (req, res) => {
  const loaded = await loadOwned(Guide, req.params.id, req, 'user');
  if (loaded.err) return fail(res, loaded.err);

  const updates = {};
  const err6 = applyIfPresent(req.body, 'package6hr', positiveNumber, updates);
  if (err6) return error(res, err6, 400);
  const err12 = applyIfPresent(req.body, 'package12hr', positiveNumber, updates);
  if (err12) return error(res, err12, 400);
  const errBike = applyIfPresent(req.body, 'bikeAddonPrice', nonNegativeNumber, updates);
  if (errBike) return error(res, errBike, 400);

  const packages = req.body?.packages;
  if (!Object.keys(updates).length && !Array.isArray(packages)) {
    return error(res, 'Provide package6hr, package12hr, bikeAddonPrice, or packages', 400);
  }

  Object.assign(loaded.doc, updates);
  await loaded.doc.save();

  if (Array.isArray(packages)) {
    for (const row of packages) {
      const pkgId = row.id || row._id;
      if (!pkgId) return error(res, 'Each package needs an id', 400);
      const pkg = await GuidePackage.findById(pkgId);
      if (!pkg || String(pkg.guide) !== String(loaded.doc._id)) {
        return error(res, 'Package not found on this listing', 404);
      }
      if (row.price !== undefined) {
        const parsed = positiveNumber(row.price, 'price');
        if (parsed.error) return error(res, parsed.error, 400);
        pkg.price = parsed.value;
      }
      if (row.bikeAddonPrice !== undefined) {
        const parsed = nonNegativeNumber(row.bikeAddonPrice, 'bikeAddonPrice');
        if (parsed.error) return error(res, parsed.error, 400);
        pkg.bikeAddonPrice = parsed.value;
      }
      await pkg.save();
    }
  }

  return success(res, mapGuideMine(loaded.doc));
};

export const patchDriverPrices = async (req, res) => {
  const loaded = await loadOwned(Driver, req.params.id, req, 'user');
  if (loaded.err) return fail(res, loaded.err);
  const updates = {};
  const errTrip = applyIfPresent(req.body, 'perTripPrice', positiveNumber, updates);
  if (errTrip) return error(res, errTrip, 400);
  const errHourly = applyIfPresent(req.body, 'hourlyRate', positiveNumber, updates);
  if (errHourly) return error(res, errHourly, 400);
  if (!Object.keys(updates).length) {
    return error(res, 'Provide perTripPrice or hourlyRate', 400);
  }
  Object.assign(loaded.doc, updates);
  await loaded.doc.save();
  return success(res, mapDriverMine(loaded.doc));
};

export const patchHomestayPrices = async (req, res) => {
  const loaded = await loadOwned(Homestay, req.params.id, req, 'vendor');
  if (loaded.err) return fail(res, loaded.err);
  const roomsInput = req.body?.rooms;
  if (!Array.isArray(roomsInput) || !roomsInput.length) {
    return error(res, 'rooms array with prices is required', 400);
  }
  for (const row of roomsInput) {
    const roomId = String(row.id || row._id || '');
    const room = loaded.doc.rooms.id(roomId);
    if (!room) return error(res, 'Room not found on this listing', 404);
    const parsed = positiveNumber(row.basePrice, 'basePrice');
    if (parsed.error) return error(res, parsed.error, 400);
    room.basePrice = parsed.value;
  }
  loaded.doc.priceFrom = Math.min(...loaded.doc.rooms.map((r) => r.basePrice));
  await loaded.doc.save();
  return success(res, mapHomestayMine(loaded.doc));
};

export const patchHorsePrices = async (req, res) => {
  const loaded = await loadOwned(Horse, req.params.id, req, 'operator');
  if (loaded.err) return fail(res, loaded.err);
  const routesInput = req.body?.routes;
  if (!Array.isArray(routesInput) || !routesInput.length) {
    return error(res, 'routes array with prices is required', 400);
  }
  for (const row of routesInput) {
    const routeId = String(row.id || row._id || '');
    const route = loaded.doc.routes.id(routeId);
    if (!route) return error(res, 'Route not found on this listing', 404);
    const parsed = positiveNumber(row.price, 'price');
    if (parsed.error) return error(res, parsed.error, 400);
    route.price = parsed.value;
  }
  loaded.doc.priceFrom = Math.min(...loaded.doc.routes.map((r) => r.price));
  await loaded.doc.save();
  return success(res, mapHorseMine(loaded.doc));
};

export const patchProductPrices = async (req, res) => {
  const loaded = await loadOwned(Product, req.params.id, req, 'vendor');
  if (loaded.err) return fail(res, loaded.err);
  const updates = {};
  const errPrice = applyIfPresent(req.body, 'price', positiveNumber, updates);
  if (errPrice) return error(res, errPrice, 400);
  const errStock = applyIfPresent(req.body, 'stock', nonNegativeNumber, updates);
  if (errStock) return error(res, errStock, 400);
  if (!Object.keys(updates).length) return error(res, 'Provide price or stock', 400);
  Object.assign(loaded.doc, updates);
  await loaded.doc.save();
  return success(res, mapProductMine(loaded.doc));
};
