import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import Tent from '../models/Tent.js';
import Guide from '../models/Guide.js';
import Driver from '../models/Driver.js';
import Homestay from '../models/Homestay.js';
import Horse from '../models/Horse.js';
import { BOOKING_TYPES, BOOKING_STATUS } from '../constants/booking.js';
import { calculateTotalAsync, getNights, resolveRoomPrice, getDefaultCommissionRate } from '../utils/pricing.js';
import { rangeHasBlocked, hasBookingConflict } from '../utils/availability.js';
import { createNotification } from '../services/notificationService.js';
import { generateInvoicePdf } from '../services/invoiceService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { success, error } from '../utils/apiResponse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createHotelBooking = async (req, res) => {
  const { hotelId, roomId, checkIn, checkOut, guests, guestRegistration } = req.body;
  const room = await Room.findById(roomId);
  if (!room) return error(res, 'Room not found', 404);
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) return error(res, 'Hotel not found', 404);

  const lead = guestRegistration?.leadGuest || {};
  if (guestRegistration) {
    if (!String(lead.fullName || '').trim()) return error(res, 'Lead guest full name is required', 400);
    if (!String(lead.mobile || '').trim()) return error(res, 'Lead guest mobile is required', 400);
    if (!String(guestRegistration?.idProof?.type || '').trim() || !String(guestRegistration?.idProof?.number || '').trim()) {
      return error(res, 'ID proof type and number are required', 400);
    }
    if (!guestRegistration?.acceptedTermsAt && !guestRegistration?.acceptTerms) {
      return error(res, 'Please accept the Terms and Conditions', 400);
    }
  }

  if (rangeHasBlocked(room.blockedDates, checkIn, checkOut)) {
    return error(res, 'Selected dates are blocked', 400);
  }
  const conflict = await hasBookingConflict({
    type: hotel.type === 'RESORT' ? BOOKING_TYPES.RESORT : BOOKING_TYPES.HOTEL,
    listingField: 'room',
    listingId: roomId,
    checkIn,
    checkOut,
    capacity: room.totalRooms || 1,
  });
  if (conflict) return error(res, 'Room not available for selected dates', 400);

  const nights = getNights(checkIn, checkOut);
  const nightPrice = resolveRoomPrice(room, checkIn);
  const subtotal = nightPrice * nights;
  const pricing = await calculateTotalAsync(subtotal);
  const commissionRate =
    hotel.commissionRate != null ? hotel.commissionRate / 100 : await getDefaultCommissionRate();

  const adults = Number(guests?.adults ?? guestRegistration?.adults ?? 1) || 1;
  const children = Number(guests?.children ?? guestRegistration?.children ?? 0) || 0;

  let registration;
  if (guestRegistration) {
    registration = {
      formDate: guestRegistration?.formDate ? new Date(guestRegistration.formDate) : new Date(),
      checkInTime: guestRegistration?.checkInTime || hotel.checkInTime || '14:00',
      checkOutTime: guestRegistration?.checkOutTime || hotel.checkOutTime || '11:00',
      leadGuest: {
        fullName: String(lead.fullName || '').trim(),
        age: lead.age != null ? Number(lead.age) : undefined,
        gender: lead.gender || '',
        mobile: String(lead.mobile || '').trim(),
        email: String(lead.email || '').trim(),
        address: String(lead.address || '').trim(),
        cityState: String(lead.cityState || '').trim(),
        pincode: String(lead.pincode || '').trim(),
        comingFrom: String(lead.comingFrom || '').trim(),
        goingTo: String(lead.goingTo || '').trim(),
        purpose: lead.purpose || '',
      },
      idProof: {
        type: guestRegistration?.idProof?.type || '',
        number: String(guestRegistration?.idProof?.number || '').trim(),
        nationality: guestRegistration?.idProof?.nationality || 'INDIAN',
      },
      coTravellers: Array.isArray(guestRegistration?.coTravellers)
        ? guestRegistration.coTravellers
            .filter((c) => String(c?.fullName || '').trim())
            .map((c) => ({
              fullName: String(c.fullName).trim(),
              age: c.age != null ? Number(c.age) : undefined,
              gender: c.gender || '',
              relationship: String(c.relationship || '').trim(),
            }))
        : [],
      roomLabel: guestRegistration?.roomLabel || room.name,
      totalNights: nights,
      tariff: nightPrice,
      advanceAmount: guestRegistration?.advanceAmount != null ? Number(guestRegistration.advanceAmount) : pricing.total,
      paymentMode: guestRegistration?.paymentMode || 'ONLINE',
      acceptedTermsAt: guestRegistration?.acceptedTermsAt
        ? new Date(guestRegistration.acceptedTermsAt)
        : new Date(),
    };
  }

  const booking = await Booking.create({
    customer: req.user._id,
    vendor: hotel.vendor,
    type: hotel.type === 'RESORT' ? BOOKING_TYPES.RESORT : BOOKING_TYPES.HOTEL,
    hotel: hotelId,
    room: roomId,
    checkIn,
    checkOut,
    guests: { adults, children },
    ...(registration ? { guestRegistration: registration } : {}),
    ...pricing,
    commission: Math.round(pricing.subtotal * commissionRate),
  });

  if (hotel.vendor) {
    await createNotification({
      userId: hotel.vendor,
      title: 'New booking request',
      message: `Hotel booking ${booking.bookingNumber} awaiting action.`,
      type: 'BOOKING',
      link: '/dashboard/vendor/bookings',
    });
  }

  return success(res, booking, 'Booking created', 201);
};

export const createTentBooking = async (req, res) => {
  const { tentId, checkIn, checkOut, tentQuantity } = req.body;
  const tent = await Tent.findById(tentId);
  if (!tent) return error(res, 'Tent not found', 404);

  if (rangeHasBlocked(tent.blockedDates, checkIn, checkOut)) {
    return error(res, 'Selected dates are blocked', 400);
  }
  const conflict = await hasBookingConflict({
    type: BOOKING_TYPES.TENT,
    listingField: 'tent',
    listingId: tentId,
    checkIn,
    checkOut,
    capacity: tent.totalTents || 10,
    quantity: tentQuantity || 1,
  });
  if (conflict) return error(res, 'Tents not available for selected dates', 400);

  const nights = getNights(checkIn, checkOut);
  const subtotal = tent.pricePerNight * tentQuantity * nights;
  const pricing = await calculateTotalAsync(subtotal);
  const booking = await Booking.create({
    customer: req.user._id,
    vendor: tent.operator,
    type: BOOKING_TYPES.TENT,
    tent: tentId,
    checkIn,
    checkOut,
    tentQuantity,
    ...pricing,
  });
  return success(res, booking, 'Tent booking created', 201);
};

export const createGuideBooking = async (req, res) => {
  const { guideId, guidePackage, bikeAddon, checkIn } = req.body;
  const guide = await Guide.findById(guideId);
  if (!guide) return error(res, 'Guide not found', 404);

  const conflict = await hasBookingConflict({
    type: BOOKING_TYPES.GUIDE,
    listingField: 'guide',
    listingId: guideId,
    checkIn,
    capacity: 1,
  });
  if (conflict) return error(res, 'Guide not available on selected date', 400);

  let subtotal = guidePackage === '12HR' ? guide.package12hr : guide.package6hr;
  if (bikeAddon) subtotal += guide.bikeAddonPrice;
  const pricing = await calculateTotalAsync(subtotal);
  const booking = await Booking.create({
    customer: req.user._id,
    vendor: guide.user,
    type: BOOKING_TYPES.GUIDE,
    guide: guideId,
    guidePackage,
    bikeAddon,
    checkIn,
    ...pricing,
  });
  return success(res, booking, 'Guide booking created', 201);
};

export const createTaxiBooking = async (req, res) => {
  const { driverId, taxiType, hours, checkIn } = req.body;
  const driver = await Driver.findById(driverId);
  if (!driver) return error(res, 'Driver not found', 404);

  const conflict = await hasBookingConflict({
    type: BOOKING_TYPES.TAXI,
    listingField: 'driver',
    listingId: driverId,
    checkIn,
    capacity: 1,
  });
  if (conflict) return error(res, 'Driver not available on selected date', 400);

  const subtotal = taxiType === 'HOURLY' ? driver.hourlyRate * (hours || 1) : driver.perTripPrice;
  const pricing = await calculateTotalAsync(subtotal);
  const booking = await Booking.create({
    customer: req.user._id,
    vendor: driver.user,
    type: BOOKING_TYPES.TAXI,
    driver: driverId,
    taxiType,
    hours,
    checkIn,
    ...pricing,
  });
  return success(res, booking, 'Taxi booking created', 201);
};

export const createHomestayBooking = async (req, res) => {
  const { homestayId, roomId, checkIn, checkOut, guests, guestRegistration } = req.body;
  const homestay = await Homestay.findById(homestayId);
  if (!homestay) return error(res, 'Homestay not found', 404);

  if (rangeHasBlocked(homestay.blockedDates, checkIn, checkOut)) {
    return error(res, 'Selected dates are blocked', 400);
  }

  const room = (homestay.rooms || []).find((r) => String(r._id) === String(roomId));
  if (!room) return error(res, 'Room not found', 404);

  const lead = guestRegistration?.leadGuest || {};
  if (!String(lead.fullName || '').trim()) return error(res, 'Lead guest full name is required', 400);
  if (!String(lead.mobile || '').trim()) return error(res, 'Lead guest mobile is required', 400);
  if (!String(guestRegistration?.idProof?.type || '').trim() || !String(guestRegistration?.idProof?.number || '').trim()) {
    return error(res, 'ID proof type and number are required', 400);
  }
  if (!guestRegistration?.acceptedTermsAt && !guestRegistration?.acceptTerms) {
    return error(res, 'Please accept the Terms and Conditions', 400);
  }

  const conflict = await hasBookingConflict({
    type: BOOKING_TYPES.HOMESTAY,
    listingField: 'homestay',
    listingId: homestayId,
    checkIn,
    checkOut,
    capacity: room.totalRooms || 1,
    extraFilter: { homestayRoomId: String(roomId) },
  });
  if (conflict) return error(res, 'Homestay room not available', 400);

  const nights = getNights(checkIn, checkOut);
  const subtotal = room.basePrice * nights;
  const pricing = await calculateTotalAsync(subtotal);
  const adults = Number(guests?.adults ?? guestRegistration?.adults ?? 1) || 1;
  const children = Number(guests?.children ?? guestRegistration?.children ?? 0) || 0;

  const registration = {
    formDate: guestRegistration?.formDate ? new Date(guestRegistration.formDate) : new Date(),
    checkInTime: guestRegistration?.checkInTime || homestay.checkInTime || '14:00',
    checkOutTime: guestRegistration?.checkOutTime || homestay.checkOutTime || '11:00',
    leadGuest: {
      fullName: String(lead.fullName || '').trim(),
      age: lead.age != null ? Number(lead.age) : undefined,
      gender: lead.gender || '',
      mobile: String(lead.mobile || '').trim(),
      email: String(lead.email || '').trim(),
      address: String(lead.address || '').trim(),
      cityState: String(lead.cityState || '').trim(),
      pincode: String(lead.pincode || '').trim(),
      comingFrom: String(lead.comingFrom || '').trim(),
      goingTo: String(lead.goingTo || '').trim(),
      purpose: lead.purpose || '',
    },
    idProof: {
      type: guestRegistration?.idProof?.type || '',
      number: String(guestRegistration?.idProof?.number || '').trim(),
      nationality: guestRegistration?.idProof?.nationality || 'INDIAN',
    },
    coTravellers: Array.isArray(guestRegistration?.coTravellers)
      ? guestRegistration.coTravellers
          .filter((c) => String(c?.fullName || '').trim())
          .map((c) => ({
            fullName: String(c.fullName).trim(),
            age: c.age != null ? Number(c.age) : undefined,
            gender: c.gender || '',
            relationship: String(c.relationship || '').trim(),
          }))
      : [],
    roomLabel: guestRegistration?.roomLabel || room.name,
    totalNights: nights,
    tariff: room.basePrice,
    advanceAmount: guestRegistration?.advanceAmount != null ? Number(guestRegistration.advanceAmount) : pricing.total,
    paymentMode: guestRegistration?.paymentMode || 'ONLINE',
    acceptedTermsAt: guestRegistration?.acceptedTermsAt
      ? new Date(guestRegistration.acceptedTermsAt)
      : new Date(),
  };

  const booking = await Booking.create({
    customer: req.user._id,
    vendor: homestay.vendor,
    type: BOOKING_TYPES.HOMESTAY,
    homestay: homestayId,
    homestayRoomId: String(roomId),
    checkIn,
    checkOut,
    guests: { adults, children },
    guestRegistration: registration,
    ...pricing,
    commission: Math.round(pricing.subtotal * ((homestay.commissionRate || 10) / 100)),
  });
  return success(res, booking, 'Homestay booking created', 201);
};

export const createHorseBooking = async (req, res) => {
  const { horseId, routeId, checkIn } = req.body;
  const horse = await Horse.findById(horseId);
  if (!horse) return error(res, 'Horse listing not found', 404);

  if (rangeHasBlocked(horse.blockedDates, checkIn, checkIn)) {
    return error(res, 'Selected date is blocked', 400);
  }

  const route = (horse.routes || []).find((r) => String(r._id) === String(routeId));
  if (!route) return error(res, 'Route not found', 404);

  const conflict = await hasBookingConflict({
    type: BOOKING_TYPES.HORSE,
    listingField: 'horse',
    listingId: horseId,
    checkIn,
    capacity: horse.availability?.slotsPerDay || 8,
  });
  if (conflict) return error(res, 'No slots available on selected date', 400);

  const pricing = await calculateTotalAsync(route.price);
  const booking = await Booking.create({
    customer: req.user._id,
    vendor: horse.operator,
    type: BOOKING_TYPES.HORSE,
    horse: horseId,
    horseRouteId: String(routeId),
    checkIn,
    ...pricing,
    commission: Math.round(pricing.subtotal * ((horse.commissionRate || 10) / 100)),
  });
  return success(res, booking, 'Horse booking created', 201);
};

export const getMyBookings = async (req, res) => {
  const { status } = req.query;
  const filter = { customer: req.user._id };
  if (status) filter.status = status;
  const bookings = await Booking.find(filter)
    .populate('hotel tent guide driver room homestay horse product combo')
    .sort('-createdAt');
  return success(res, bookings);
};

export const getVendorBookings = async (req, res) => {
  const bookings = await Booking.find({ vendor: req.user._id })
    .populate('customer', 'name email phone')
    .populate('hotel tent guide driver room homestay horse product combo')
    .sort('-createdAt');
  return success(res, bookings);
};

export const getAllBookings = async (req, res) => {
  const bookings = await Booking.find()
    .populate('customer', 'name email')
    .populate('hotel tent guide driver homestay horse product combo')
    .sort('-createdAt')
    .limit(100);
  return success(res, bookings);
};

export const updateBookingStatus = async (req, res) => {
  const existing = await Booking.findById(req.params.id);
  if (!existing) return error(res, 'Booking not found', 404);

  if (req.body.status === BOOKING_STATUS.CONFIRMED && existing.vendor) {
    const { canVendorAcceptBooking, deductPointsForBooking } = await import('../services/walletService.js');
    const gate = await canVendorAcceptBooking(existing.vendor);
    if (!gate.ok) {
      return error(res, gate.reason || 'Cannot accept booking — subscription or points required', 403);
    }
    if (gate.via === 'POINTS') {
      const deducted = await deductPointsForBooking(existing.vendor, existing._id);
      if (deducted && deducted.ok === false) {
        return error(res, deducted.reason || 'Insufficient points', 403);
      }
    }
  }

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
      ...(req.body.cancellationReason && { cancellationReason: req.body.cancellationReason }),
      ...(req.body.status === BOOKING_STATUS.CANCELLED && { cancelledAt: new Date() }),
    },
    { new: true }
  );

  await createNotification({
    userId: booking.customer,
    title: `Booking ${req.body.status?.toLowerCase()}`,
    message: `Your booking ${booking.bookingNumber} is now ${req.body.status}.`,
    type: 'BOOKING',
    link: '/dashboard/customer/bookings',
  });

  return success(res, booking);
};

export const downloadInvoice = async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(
    'customer vendor hotel tent guide driver homestay horse'
  );
  if (!booking) return error(res, 'Booking not found', 404);
  if (
    String(booking.customer._id || booking.customer) !== String(req.user._id) &&
    req.user.role !== 'SUPER_ADMIN'
  ) {
    return error(res, 'Forbidden', 403);
  }

  // Always regenerate so invoice formatting updates apply to existing bookings
  const listingName =
    booking.hotel?.name ||
    booking.homestay?.name ||
    booking.tent?.name ||
    booking.guide?.name ||
    booking.driver?.name ||
    booking.horse?.name ||
    booking.type;
  const invoice = await generateInvoicePdf({
    booking,
    customer: booking.customer,
    vendor: booking.vendor,
    listingName,
    gstNumber: booking.hotel?.gstNumber || booking.homestay?.gstNumber,
  });
  booking.invoiceNumber = invoice.invoiceNumber;
  booking.invoiceUrl = invoice.invoiceUrl;
  await booking.save();

  return res.download(invoice.filePath, `${booking.invoiceNumber || booking.bookingNumber}.pdf`);
};
