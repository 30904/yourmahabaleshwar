import Tent from '../models/Tent.js';
import Guide from '../models/Guide.js';
import Driver from '../models/Driver.js';
import User from '../models/User.js';
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
import {
  getBookedDates,
  getUnavailableDates,
  availabilityWindow,
  normalizeBlockedDates,
  applyBlockedDateAction,
  toDateKey,
} from '../utils/availability.js';
import { BOOKING_TYPES } from '../constants/booking.js';
import { ROLES } from '../constants/roles.js';
import { denyIfNotOwner } from '../utils/vendorListingAccess.js';
import { publicStaySubscriptionFilter } from '../services/stayListingSubscriptionService.js';

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
  const vendorType = String(req.query.vendorType || '').toUpperCase();
  if (vendorType === 'TAXI' || vendorType === 'DRIVER') {
    const role = vendorType === 'TAXI' ? ROLES.TAXI_OPERATOR : ROLES.DRIVER;
    const ownerIds = await User.find({ role }).distinct('_id');
    filter.user = { $in: ownerIds };
  }
  return success(res, await paginate(Driver, filter, req, enrichDriver));
};
export const getDriverBySlug = async (req, res) => {
  const driver = await Driver.findOne({ slug: req.params.slug, isActive: { $ne: false } });
  if (!driver) return error(res, 'Driver not found', 404);
  return success(res, enrichDriver(driver));
};

export const getHomestays = async (req, res) =>
  success(res, await paginate(Homestay, publicStaySubscriptionFilter(), req, enrichHomestay));
export const getHomestayBySlug = async (req, res) => {
  const item = await Homestay.findOne({
    slug: req.params.slug,
    isActive: { $ne: false },
    ...publicStaySubscriptionFilter(),
  });
  if (!item) return error(res, 'Homestay/Villa not found', 404);
  return success(res, enrichHomestay(item));
};

export const getHorses = async (req, res) => success(res, await paginate(Horse, {}, req, enrichHorse));
export const getHorseBySlug = async (req, res) => {
  const item = await Horse.findOne({ slug: req.params.slug, isActive: { $ne: false } });
  if (!item) return error(res, 'Horse listing not found', 404);
  return success(res, enrichHorse(item));
};

const listingAvailability = async ({ id, name, type, vertical, listingField, bookingType, blockedDates, from, to }) => {
  const bookedDates = await getBookedDates({
    type: bookingType,
    listingField,
    listingId: id,
    from,
    to,
  });
  return {
    id: String(id),
    name,
    type,
    vertical,
    blockedDates: normalizeBlockedDates(blockedDates, from, to),
    bookedDates,
  };
};

export const getMyAvailability = async (req, res) => {
  const { from, to } = availabilityWindow(req.query.from, req.query.to, 90);
  const owner = req.user._id;
  const role = req.user.role;
  const listings = [];

  if (role === ROLES.HOTEL_VENDOR) {
    const hotels = await Hotel.find({ vendor: owner }).select('name type').sort('-createdAt').limit(200);
    const hotelIds = hotels.map((h) => h._id);
    const rooms = await Room.find({ hotel: { $in: hotelIds } }).select('name blockedDates hotel');
    const hotelById = Object.fromEntries(hotels.map((h) => [String(h._id), h]));
    for (const room of rooms) {
      const hotel = hotelById[String(room.hotel)];
      listings.push(
        await listingAvailability({
          id: room._id,
          name: hotel ? `${hotel.name} — ${room.name}` : room.name,
          type: 'room',
          vertical: hotel?.type || 'HOTEL',
          listingField: 'room',
          bookingType: hotel?.type === 'RESORT' ? BOOKING_TYPES.RESORT : BOOKING_TYPES.HOTEL,
          blockedDates: room.blockedDates,
          from,
          to,
        })
      );
    }
  } else if (role === ROLES.HOMESTAY_VENDOR) {
    const docs = await Homestay.find({ vendor: owner }).sort('-createdAt').limit(200);
    for (const doc of docs) {
      listings.push(
        await listingAvailability({
          id: doc._id,
          name: doc.name,
          type: 'homestay',
          vertical: 'HOMESTAY',
          listingField: 'homestay',
          bookingType: BOOKING_TYPES.HOMESTAY,
          blockedDates: doc.blockedDates,
          from,
          to,
        })
      );
    }
  } else if (role === ROLES.TENT_OPERATOR) {
    const docs = await Tent.find({ operator: owner }).sort('-createdAt').limit(200);
    for (const doc of docs) {
      listings.push(
        await listingAvailability({
          id: doc._id,
          name: doc.name,
          type: 'tent',
          vertical: 'TENT',
          listingField: 'tent',
          bookingType: BOOKING_TYPES.TENT,
          blockedDates: doc.blockedDates,
          from,
          to,
        })
      );
    }
  } else if (role === ROLES.HORSE_OPERATOR) {
    const docs = await Horse.find({ operator: owner }).sort('-createdAt').limit(200);
    for (const doc of docs) {
      listings.push(
        await listingAvailability({
          id: doc._id,
          name: doc.name,
          type: 'horse',
          vertical: 'HORSE',
          listingField: 'horse',
          bookingType: BOOKING_TYPES.HORSE,
          blockedDates: doc.blockedDates,
          from,
          to,
        })
      );
    }
  } else if (role === ROLES.GUIDE) {
    const docs = await Guide.find({ user: owner }).sort('-createdAt').limit(200);
    for (const doc of docs) {
      listings.push(
        await listingAvailability({
          id: doc._id,
          name: doc.name,
          type: 'guide',
          vertical: 'GUIDE',
          listingField: 'guide',
          bookingType: BOOKING_TYPES.GUIDE,
          blockedDates: doc.blockedDates || [],
          from,
          to,
        })
      );
    }
  } else if (role === ROLES.TAXI_OPERATOR || role === ROLES.DRIVER) {
    const docs = await Driver.find({ user: owner }).sort('-createdAt').limit(200);
    for (const doc of docs) {
      listings.push(
        await listingAvailability({
          id: doc._id,
          name: doc.name,
          type: 'driver',
          vertical: 'TAXI',
          listingField: 'driver',
          bookingType: BOOKING_TYPES.TAXI,
          blockedDates: doc.blockedDates || [],
          from,
          to,
        })
      );
    }
  }

  return success(res, {
    from: toDateKey(from),
    to: toDateKey(to),
    listings,
  });
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
    const driver = await Driver.findById(id);
    if (!driver) return error(res, 'Not found', 404);
    blockedDates = driver.blockedDates || [];
    capacity = 1;
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
  let ownerField;
  if (type === 'tent') {
    doc = await Tent.findById(id);
    ownerField = 'operator';
  } else if (type === 'homestay') {
    doc = await Homestay.findById(id);
    ownerField = 'vendor';
  } else if (type === 'horse') {
    doc = await Horse.findById(id);
    ownerField = 'operator';
  } else if (type === 'driver') {
    doc = await Driver.findById(id);
    ownerField = 'user';
  } else if (type === 'room') {
    doc = await Room.findById(id);
  } else {
    return error(res, 'Invalid type', 400);
  }

  if (!doc) return error(res, 'Not found', 404);

  if (type === 'room') {
    const hotel = await Hotel.findById(doc.hotel).select('vendor');
    const denied = denyIfNotOwner(req, hotel, 'vendor');
    if (denied) return error(res, denied.message, denied.status);
  } else {
    const denied = denyIfNotOwner(req, doc, ownerField);
    if (denied) return error(res, denied.message, denied.status);
  }

  doc.blockedDates = applyBlockedDateAction(doc.blockedDates, blockedDates, action);
  await doc.save();
  return success(
    res,
    {
      id: String(doc._id),
      type,
      blockedDates: (doc.blockedDates || []).map((d) => toDateKey(d)),
    },
    'Availability updated'
  );
};

export const globalSearch = async (req, res) => {
  const { q = '', limit = 12 } = req.query;
  const regex = { $regex: q || 'Mahabaleshwar', $options: 'i' };
  const cap = Number(limit);
  const [hotelsRaw, tentsRaw, guidesRaw, driversRaw, homestaysRaw, horsesRaw] = await Promise.all([
    Hotel.find({ isActive: true, name: regex, ...publicStaySubscriptionFilter() }).limit(cap),
    Tent.find({ isActive: { $ne: false }, name: regex }).limit(cap),
    Guide.find({ isActive: { $ne: false }, name: regex }).limit(cap),
    Driver.find({ isActive: { $ne: false }, name: regex }).limit(cap),
    Homestay.find({ isActive: { $ne: false }, name: regex, ...publicStaySubscriptionFilter() }).limit(cap),
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
