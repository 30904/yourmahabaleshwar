import Tent from '../models/Tent.js';
import Guide from '../models/Guide.js';
import Driver from '../models/Driver.js';
import Hotel from '../models/Hotel.js';
import Homestay from '../models/Homestay.js';
import Horse from '../models/Horse.js';
import Room from '../models/Room.js';
import { success, error } from '../utils/apiResponse.js';
import {
  attachHotelPrices,
  enrichTent,
  enrichGuide,
  enrichDriver,
  enrichHomestay,
  enrichHorse,
} from '../utils/listingEnrich.js';
import { getUnavailableDates } from '../utils/availability.js';
import { BOOKING_TYPES } from '../constants/booking.js';

const paginate = async (Model, filter, req, enrichFn) => {
  const { search, page = 1, limit = 12, featured } = req.query;
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (featured === 'true') filter.isFeatured = true;
  filter.isActive = { $ne: false };
  const skip = (page - 1) * limit;
  const [raw, total] = await Promise.all([
    Model.find(filter).skip(skip).limit(Number(limit)).sort('-createdAt'),
    Model.countDocuments(filter),
  ]);
  const items = enrichFn ? raw.map(enrichFn) : raw;
  return { items, total, page: Number(page), pages: Math.ceil(total / limit) };
};

export const getTents = async (req, res) => success(res, await paginate(Tent, {}, req, enrichTent));
export const getTentBySlug = async (req, res) => {
  const tent = await Tent.findOne({ slug: req.params.slug, isActive: { $ne: false } });
  if (!tent) return error(res, 'Tent not found', 404);
  return success(res, enrichTent(tent));
};

export const getGuides = async (req, res) => success(res, await paginate(Guide, {}, req, enrichGuide));
export const getGuideBySlug = async (req, res) => {
  const guide = await Guide.findOne({ slug: req.params.slug, isActive: { $ne: false } });
  if (!guide) return error(res, 'Guide not found', 404);
  return success(res, enrichGuide(guide));
};

export const getDrivers = async (req, res) => {
  const filter = {};
  if (req.query.vehicleType) filter.vehicleType = req.query.vehicleType;
  return success(res, await paginate(Driver, filter, req, enrichDriver));
};
export const getDriverBySlug = async (req, res) => {
  const driver = await Driver.findOne({ slug: req.params.slug, isActive: { $ne: false } });
  if (!driver) return error(res, 'Driver not found', 404);
  return success(res, enrichDriver(driver));
};

export const getHomestays = async (req, res) =>
  success(res, await paginate(Homestay, {}, req, enrichHomestay));
export const getHomestayBySlug = async (req, res) => {
  const item = await Homestay.findOne({ slug: req.params.slug, isActive: { $ne: false } });
  if (!item) return error(res, 'Homestay not found', 404);
  return success(res, enrichHomestay(item));
};

export const getHorses = async (req, res) => success(res, await paginate(Horse, {}, req, enrichHorse));
export const getHorseBySlug = async (req, res) => {
  const item = await Horse.findOne({ slug: req.params.slug, isActive: { $ne: false } });
  if (!item) return error(res, 'Horse listing not found', 404);
  return success(res, enrichHorse(item));
};

export const getListingAvailability = async (req, res) => {
  const { type, id } = req.params;
  const { from, to } = req.query;
  if (!from || !to) return error(res, 'from and to query params required', 400);

  let blockedDates = [];
  let capacity = 1;
  let listingField = type;
  let bookingType = type.toUpperCase();

  if (type === 'tent') {
    const tent = await Tent.findById(id);
    if (!tent) return error(res, 'Not found', 404);
    blockedDates = tent.blockedDates;
    capacity = tent.totalTents || 10;
    listingField = 'tent';
    bookingType = BOOKING_TYPES.TENT;
  } else if (type === 'homestay') {
    const hs = await Homestay.findById(id);
    if (!hs) return error(res, 'Not found', 404);
    blockedDates = hs.blockedDates;
    capacity = 1;
    listingField = 'homestay';
    bookingType = BOOKING_TYPES.HOMESTAY;
  } else if (type === 'horse') {
    const horse = await Horse.findById(id);
    if (!horse) return error(res, 'Not found', 404);
    blockedDates = horse.blockedDates;
    capacity = horse.availability?.slotsPerDay || 8;
    listingField = 'horse';
    bookingType = BOOKING_TYPES.HORSE;
  } else if (type === 'room') {
    const room = await Room.findById(id);
    if (!room) return error(res, 'Not found', 404);
    blockedDates = room.blockedDates;
    capacity = room.totalRooms || 1;
    listingField = 'room';
    bookingType = BOOKING_TYPES.HOTEL;
  } else if (type === 'guide') {
    listingField = 'guide';
    bookingType = BOOKING_TYPES.GUIDE;
  } else if (type === 'driver') {
    listingField = 'driver';
    bookingType = BOOKING_TYPES.TAXI;
  } else {
    return error(res, 'Invalid type', 400);
  }

  const unavailable = await getUnavailableDates({
    type: bookingType,
    listingField,
    listingId: id,
    from,
    to,
    blockedDates,
    capacity,
  });

  return success(res, { unavailable, blockedDates, from, to });
};

export const updateBlockedDates = async (req, res) => {
  const { type, id } = req.params;
  const { blockedDates = [], action = 'set' } = req.body;
  let doc;
  if (type === 'tent') doc = await Tent.findById(id);
  else if (type === 'homestay') doc = await Homestay.findById(id);
  else if (type === 'horse') doc = await Horse.findById(id);
  else if (type === 'room') doc = await Room.findById(id);
  else return error(res, 'Invalid type', 400);

  if (!doc) return error(res, 'Not found', 404);

  if (action === 'add') {
    const existing = new Set((doc.blockedDates || []).map((d) => new Date(d).toISOString().slice(0, 10)));
    for (const d of blockedDates) existing.add(new Date(d).toISOString().slice(0, 10));
    doc.blockedDates = [...existing].map((s) => new Date(s));
  } else if (action === 'remove') {
    const remove = new Set(blockedDates.map((d) => new Date(d).toISOString().slice(0, 10)));
    doc.blockedDates = (doc.blockedDates || []).filter(
      (d) => !remove.has(new Date(d).toISOString().slice(0, 10))
    );
  } else {
    doc.blockedDates = blockedDates.map((d) => new Date(d));
  }
  await doc.save();
  return success(res, doc, 'Availability updated');
};

export const globalSearch = async (req, res) => {
  const { q = '', limit = 12 } = req.query;
  const regex = { $regex: q || 'Mahabaleshwar', $options: 'i' };
  const cap = Number(limit);
  const [hotelsRaw, tentsRaw, guidesRaw, driversRaw, homestaysRaw, horsesRaw] = await Promise.all([
    Hotel.find({ isActive: true, name: regex }).limit(cap),
    Tent.find({ isActive: { $ne: false }, name: regex }).limit(cap),
    Guide.find({ isActive: { $ne: false }, name: regex }).limit(cap),
    Driver.find({ isActive: { $ne: false }, name: regex }).limit(cap),
    Homestay.find({ isActive: { $ne: false }, name: regex }).limit(cap),
    Horse.find({ isActive: { $ne: false }, name: regex }).limit(cap),
  ]);
  const hotels = await attachHotelPrices(hotelsRaw);
  return success(res, {
    hotels,
    tents: tentsRaw.map(enrichTent),
    guides: guidesRaw.map(enrichGuide),
    drivers: driversRaw.map(enrichDriver),
    homestays: homestaysRaw.map(enrichHomestay),
    horses: horsesRaw.map(enrichHorse),
    query: q,
  });
};
