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
import User from '../models/User.js';
import { ROLES } from '../constants/roles.js';
import { getServiceMonetizationConfig } from '../services/serviceMonetizationService.js';
import {
  canServiceVendorAcceptBooking,
  deductServicePointsForBooking,
} from '../services/serviceMonetizationService.js';
import { serviceTenantForRole } from '../constants/serviceMonetization.js';
import { emitOpenBookingCreated, emitOpenBookingRemoved } from '../services/openBookingSocket.js';
import { taxiRoutePrice } from '../constants/taxiClientRateChart.js';
import { guideOpenPrice, normalizeGuidePackageId } from '../constants/guideClientRateChart.js';
import { driverPackagePrice } from '../constants/driverClientRateChart.js';
import { horsePackagePrice } from '../constants/horseClientRateChart.js';

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
  const { tentId, checkIn, checkOut, tentQuantity, open, guestRegistration } = req.body;
  if (open === true || open === 'true' || !tentId) {
    return createOpenServiceBooking(req, res, 'TENT');
  }
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
  const { guideId, guidePackage, bikeAddon, checkIn, guestRegistration, open } = req.body;
  if (open === true || open === 'true' || !guideId) {
    return createOpenServiceBooking(req, res, 'GUIDE');
  }
  const guide = await Guide.findById(guideId);
  if (!guide) return error(res, 'Guide not found', 404);

  const lead = guestRegistration?.leadGuest || {};
  if (!String(lead.fullName || '').trim()) return error(res, 'Customer full name is required', 400);
  if (!String(lead.mobile || '').trim()) return error(res, 'Mobile number is required', 400);
  if (!guestRegistration?.acceptedTermsAt && !guestRegistration?.acceptTerms) {
    return error(res, 'Please accept the Terms and Conditions', 400);
  }

  const conflict = await hasBookingConflict({
    type: BOOKING_TYPES.GUIDE,
    listingField: 'guide',
    listingId: guideId,
    checkIn,
    capacity: 1,
  });
  if (conflict) return error(res, 'Guide not available on selected date', 400);

  const packageType = guidePackage === '12HR' ? '12HR' : '6HR';
  const useBikeAddon = bikeAddon === true || bikeAddon === 'true' || guestRegistration?.tourDetails?.bikeAddon === true;
  let subtotal = packageType === '12HR' ? guide.package12hr : guide.package6hr;
  const bikeAddonPrice = useBikeAddon ? guide.bikeAddonPrice || 0 : 0;
  if (useBikeAddon) subtotal += bikeAddonPrice;
  const pricing = await calculateTotalAsync(subtotal);

  const registration = {
    formDate: guestRegistration?.formDate ? new Date(guestRegistration.formDate) : new Date(),
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
      purpose: lead.purpose || 'TOURISM',
    },
    idProof: guestRegistration?.idProof?.type
      ? {
          type: guestRegistration.idProof.type,
          number: String(guestRegistration.idProof.number || '').trim(),
          nationality: guestRegistration.idProof.nationality || 'INDIAN',
        }
      : undefined,
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
    advanceAmount: guestRegistration?.advanceAmount != null ? Number(guestRegistration.advanceAmount) : pricing.total,
    paymentMode: guestRegistration?.paymentMode || 'ONLINE',
    acceptedTermsAt: guestRegistration?.acceptedTermsAt
      ? new Date(guestRegistration.acceptedTermsAt)
      : new Date(),
    tourDetails: {
      packageType,
      bikeAddon: useBikeAddon,
      startTime: guestRegistration?.tourDetails?.startTime || guestRegistration?.checkInTime || '',
      touristCount: Number(guestRegistration?.tourDetails?.touristCount ?? guestRegistration?.adults ?? 1) || 1,
      pickupLocation: String(guestRegistration?.tourDetails?.pickupLocation || '').trim(),
      preferredSpots: Array.isArray(guestRegistration?.tourDetails?.preferredSpots)
        ? guestRegistration.tourDetails.preferredSpots.filter(Boolean)
        : [],
      specialRequests: String(guestRegistration?.tourDetails?.specialRequests || '').trim(),
      packagePrice: packageType === '12HR' ? guide.package12hr : guide.package6hr,
      bikeAddonPrice: useBikeAddon ? bikeAddonPrice : 0,
    },
  };

  const adults = Number(guestRegistration?.adults ?? registration.tourDetails.touristCount ?? 1) || 1;

  const booking = await Booking.create({
    customer: req.user._id,
    vendor: guide.user,
    type: BOOKING_TYPES.GUIDE,
    guide: guideId,
    guidePackage: packageType,
    bikeAddon: useBikeAddon,
    checkIn,
    guests: { adults, children: 0 },
    guestRegistration: registration,
    ...pricing,
    commission: Math.round(pricing.subtotal * ((guide.commissionRate || 12) / 100)),
  });
  return success(res, booking, 'Guide booking created', 201);
};

export const createTaxiBooking = async (req, res) => {
  const { driverId, taxiType, hours, checkIn, guestRegistration, open, serviceTenant } = req.body;
  if (open === true || open === 'true' || !driverId) {
    const tenant = String(serviceTenant || 'TAXI').toUpperCase() === 'DRIVER' ? 'DRIVER' : 'TAXI';
    return createOpenServiceBooking(req, res, tenant);
  }
  const driver = await Driver.findById(driverId);
  if (!driver) return error(res, 'Driver not found', 404);

  const lead = guestRegistration?.leadGuest || {};
  if (guestRegistration) {
    if (!String(lead.fullName || '').trim()) return error(res, 'Lead guest full name is required', 400);
    if (!String(lead.mobile || '').trim()) return error(res, 'Lead guest mobile is required', 400);
    if (!guestRegistration?.acceptedTermsAt && !guestRegistration?.acceptTerms) {
      return error(res, 'Please accept the Terms and Conditions', 400);
    }
  }

  const conflict = await hasBookingConflict({
    type: BOOKING_TYPES.TAXI,
    listingField: 'driver',
    listingId: driverId,
    checkIn,
    capacity: 1,
  });
  if (conflict) return error(res, 'Driver not available on selected date', 400);

  const tripType =
    taxiType === 'HOURLY' || guestRegistration?.taxiDetails?.tripType === 'HOURLY' ? 'HOURLY' : 'PER_TRIP';
  const tripHours =
    tripType === 'HOURLY'
      ? Number(hours || guestRegistration?.taxiDetails?.hours || 1) || 1
      : undefined;
  const subtotal =
    tripType === 'HOURLY' ? driver.hourlyRate * (tripHours || 1) : driver.perTripPrice;
  const pricing = await calculateTotalAsync(subtotal);

  const registration = guestRegistration
    ? {
        formDate: guestRegistration?.formDate ? new Date(guestRegistration.formDate) : new Date(),
        checkInTime: guestRegistration?.checkInTime || guestRegistration?.taxiDetails?.startTime || '',
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
          purpose: lead.purpose || 'TOURISM',
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
        advanceAmount:
          guestRegistration?.advanceAmount != null ? Number(guestRegistration.advanceAmount) : pricing.total,
        paymentMode: guestRegistration?.paymentMode || 'ONLINE',
        acceptedTermsAt: guestRegistration?.acceptedTermsAt
          ? new Date(guestRegistration.acceptedTermsAt)
          : new Date(),
        taxiDetails: {
          tripType,
          hours: tripHours,
          startTime: guestRegistration?.taxiDetails?.startTime || guestRegistration?.checkInTime || '',
          passengerCount:
            Number(guestRegistration?.taxiDetails?.passengerCount ?? guestRegistration?.adults ?? 1) || 1,
          pickupLocation: String(guestRegistration?.taxiDetails?.pickupLocation || lead.comingFrom || '').trim(),
          dropLocation: String(guestRegistration?.taxiDetails?.dropLocation || lead.goingTo || '').trim(),
          preferredDestinations: Array.isArray(guestRegistration?.taxiDetails?.preferredDestinations)
            ? guestRegistration.taxiDetails.preferredDestinations.filter(Boolean)
            : [],
          specialRequests: String(guestRegistration?.taxiDetails?.specialRequests || '').trim(),
          tripPrice: subtotal,
          hourlyRate: driver.hourlyRate || 0,
          perTripPrice: driver.perTripPrice || 0,
        },
      }
    : undefined;

  const adults =
    Number(guestRegistration?.adults ?? registration?.taxiDetails?.passengerCount ?? 1) || 1;

  const booking = await Booking.create({
    customer: req.user._id,
    vendor: driver.user,
    type: BOOKING_TYPES.TAXI,
    driver: driverId,
    taxiType: tripType,
    hours: tripHours,
    checkIn,
    guests: { adults, children: 0 },
    guestRegistration: registration,
    ...pricing,
    commission: Math.round(pricing.subtotal * ((driver.commissionRate || 8) / 100)),
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
  const { horseId, routeId, checkIn, guestRegistration, open } = req.body;
  if (open === true || open === 'true' || !horseId) {
    return createOpenServiceBooking(req, res, 'HORSE');
  }
  const horse = await Horse.findById(horseId);
  if (!horse) return error(res, 'Horse listing not found', 404);

  const lead = guestRegistration?.leadGuest || {};
  if (guestRegistration) {
    if (!String(lead.fullName || '').trim()) return error(res, 'Customer full name is required', 400);
    if (!String(lead.mobile || '').trim()) return error(res, 'Mobile number is required', 400);
    if (!guestRegistration?.acceptedTermsAt && !guestRegistration?.acceptTerms) {
      return error(res, 'Please accept the Terms and Conditions', 400);
    }
  }

  if (rangeHasBlocked(horse.blockedDates, checkIn, checkIn)) {
    return error(res, 'Selected date is blocked', 400);
  }

  const resolvedRouteId = routeId || guestRegistration?.horseDetails?.routeId;
  const route = (horse.routes || []).find((r) => String(r._id) === String(resolvedRouteId));
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

  const registration = guestRegistration
    ? {
        formDate: guestRegistration?.formDate ? new Date(guestRegistration.formDate) : new Date(),
        checkInTime: guestRegistration?.horseDetails?.startTime || guestRegistration?.checkInTime || '',
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
          purpose: lead.purpose || 'TOURISM',
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
        advanceAmount:
          guestRegistration?.advanceAmount != null ? Number(guestRegistration.advanceAmount) : pricing.total,
        paymentMode: guestRegistration?.paymentMode || 'ONLINE',
        acceptedTermsAt: guestRegistration?.acceptedTermsAt
          ? new Date(guestRegistration.acceptedTermsAt)
          : new Date(),
        horseDetails: {
          routeId: String(resolvedRouteId),
          routeName: route.name,
          durationMinutes: route.durationMinutes || 30,
          startTime: guestRegistration?.horseDetails?.startTime || guestRegistration?.checkInTime || '',
          riderCount: Number(guestRegistration?.horseDetails?.riderCount ?? guestRegistration?.adults ?? 1) || 1,
          meetingPoint: String(guestRegistration?.horseDetails?.meetingPoint || '').trim(),
          specialRequests: String(guestRegistration?.horseDetails?.specialRequests || '').trim(),
          safetyAcknowledged: guestRegistration?.horseDetails?.safetyAcknowledged === true,
          routePrice: route.price,
        },
      }
    : undefined;

  const adults = Number(guestRegistration?.adults ?? registration?.horseDetails?.riderCount ?? 1) || 1;

  const booking = await Booking.create({
    customer: req.user._id,
    vendor: horse.operator,
    type: BOOKING_TYPES.HORSE,
    horse: horseId,
    horseRouteId: String(resolvedRouteId),
    checkIn,
    guests: { adults, children: 0 },
    ...(registration ? { guestRegistration: registration } : {}),
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

  const isVendor = req.user.role !== ROLES.SUPER_ADMIN && !['OFFICE_STAFF_HOTEL', 'OFFICE_STAFF_GUIDE'].includes(req.user.role);
  if (isVendor && String(existing.vendor) !== String(req.user._id)) {
    return error(res, 'Forbidden', 403);
  }

  if (req.body.status === BOOKING_STATUS.CONFIRMED) {
    if (existing.assignmentStatus === 'UNASSIGNED' || !existing.vendor) {
      return error(res, 'Booking must be assigned to a vendor before confirmation', 403);
    }
    if (existing.serviceTenant) {
      const gate = await canServiceVendorAcceptBooking(existing.vendor, existing);
      if (!gate.ok) {
        return error(res, gate.reason || 'Recharge points or activate unlimited plan to accept bookings', 403);
      }
      if (gate.via === 'POINTS') {
        const deducted = await deductServicePointsForBooking(existing.vendor, existing);
        if (deducted?.ok === false) {
          return error(res, deducted.reason || 'Insufficient points', 403);
        }
      }
    } else if (existing.vendor) {
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

async function createOpenServiceBooking(req, res, serviceTenant) {
  const tenant = String(serviceTenant || '').toUpperCase();
  const config = await getServiceMonetizationConfig(tenant);
  const {
    checkIn,
    checkOut,
    tentQuantity,
    guidePackage,
    bikeAddon,
    taxiType,
    hours,
    guestRegistration,
  } = req.body;

  const lead = guestRegistration?.leadGuest || {};
  if (!String(lead.fullName || '').trim()) return error(res, 'Customer full name is required', 400);
  if (!String(lead.mobile || '').trim()) return error(res, 'Mobile number is required', 400);
  if (!guestRegistration?.acceptedTermsAt && !guestRegistration?.acceptTerms) {
    return error(res, 'Please accept the Terms and Conditions', 400);
  }
  if (!checkIn) return error(res, 'Date is required', 400);

  let subtotal = 0;
  let bookingType = BOOKING_TYPES.GUIDE;
  let extra = {};

  if (tenant === 'GUIDE') {
    bookingType = BOOKING_TYPES.GUIDE;
    const packageType = normalizeGuidePackageId(
      guestRegistration?.tourDetails?.packageType || guidePackage
    );
    const useBike = bikeAddon === true || bikeAddon === 'true' || guestRegistration?.tourDetails?.bikeAddon === true;
    const quoted = Number(guestRegistration?.tourDetails?.packagePrice);
    subtotal = quoted > 0 ? quoted : guideOpenPrice(packageType, useBike);
    extra.guidePackage = packageType;
    extra.bikeAddon = useBike;
  } else if (tenant === 'TENT') {
    bookingType = BOOKING_TYPES.TENT;
    const nights = getNights(checkIn, checkOut || checkIn);
    subtotal = (config.defaultPricePerNight || 2000) * (tentQuantity || 1) * Math.max(nights, 1);
    extra.tentQuantity = tentQuantity || 1;
    extra.checkOut = checkOut || checkIn;
  } else if (tenant === 'TAXI') {
    bookingType = BOOKING_TYPES.TAXI;
    const routeId = guestRegistration?.taxiDetails?.routeId;
    const tripPrice = Number(guestRegistration?.taxiDetails?.tripPrice);
    subtotal = tripPrice > 0 ? tripPrice : taxiRoutePrice(routeId);
    extra.taxiType = 'PER_TRIP';
    extra.routeId = routeId || null;
  } else if (tenant === 'DRIVER') {
    bookingType = BOOKING_TYPES.TAXI;
    const packageId = guestRegistration?.taxiDetails?.packageId;
    const tripPrice = Number(guestRegistration?.taxiDetails?.tripPrice);
    subtotal = tripPrice > 0 ? tripPrice : driverPackagePrice(packageId);
    extra.taxiType = 'PACKAGE';
    extra.driverPackageId = packageId || null;
  } else if (tenant === 'HORSE') {
    bookingType = BOOKING_TYPES.HORSE;
    const routeId = guestRegistration?.horseDetails?.routeId || 'sightseeing';
    const routePrice = Number(guestRegistration?.horseDetails?.routePrice);
    subtotal = routePrice > 0 ? routePrice : horsePackagePrice(routeId);
    extra.horseRouteId = routeId;
  } else {
    return error(res, 'Unsupported service type', 400);
  }

  const pricing = await calculateTotalAsync(subtotal);
  const registration = {
    ...(guestRegistration || {}),
    formDate: guestRegistration?.formDate ? new Date(guestRegistration.formDate) : new Date(),
    leadGuest: {
      fullName: String(lead.fullName || '').trim(),
      mobile: String(lead.mobile || '').trim(),
      email: String(lead.email || '').trim(),
      address: String(lead.address || '').trim(),
      cityState: String(lead.cityState || '').trim(),
      pincode: String(lead.pincode || '').trim(),
      comingFrom: String(lead.comingFrom || '').trim(),
      goingTo: String(lead.goingTo || '').trim(),
      purpose: lead.purpose || 'TOURISM',
      age: lead.age != null ? Number(lead.age) : undefined,
      gender: lead.gender || '',
    },
    taxiDetails: guestRegistration?.taxiDetails,
    tourDetails: guestRegistration?.tourDetails,
    horseDetails: guestRegistration?.horseDetails,
    coTravellers: Array.isArray(guestRegistration?.coTravellers)
      ? guestRegistration.coTravellers
      : [],
    acceptedTermsAt: guestRegistration?.acceptedTermsAt ? new Date(guestRegistration.acceptedTermsAt) : new Date(),
    advanceAmount: guestRegistration?.advanceAmount != null ? Number(guestRegistration.advanceAmount) : pricing.total,
    paymentMode: guestRegistration?.paymentMode || 'ONLINE',
  };

  const booking = await Booking.create({
    customer: req.user._id,
    vendor: null,
    serviceTenant: tenant,
    assignmentStatus: 'UNASSIGNED',
    type: bookingType,
    checkIn,
    checkOut: extra.checkOut,
    guestRegistration: registration,
    guests: { adults: Number(guestRegistration?.adults || 1) || 1, children: 0 },
    ...extra,
    ...pricing,
    commission: Math.round(pricing.subtotal * 0.1),
    notes: 'Awaiting vendor acceptance',
  });

  await booking.populate('customer', 'name phone email');
  emitOpenBookingCreated(booking);

  return success(res, booking, 'Booking request submitted — vendors will be notified', 201);
}

export const assignVendorToBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return error(res, 'Booking not found', 404);
  if (!booking.serviceTenant) return error(res, 'Not a service booking', 400);

  const { vendorId, listingId } = req.body;
  if (!vendorId) return error(res, 'vendorId is required', 400);

  const vendor = await User.findById(vendorId);
  if (!vendor) return error(res, 'Vendor not found', 404);
  const expectedTenant = serviceTenantForRole(vendor.role);
  if (expectedTenant !== booking.serviceTenant) {
    return error(res, `Vendor role does not match booking type (${booking.serviceTenant})`, 400);
  }

  booking.vendor = vendorId;
  booking.assignmentStatus = 'ASSIGNED';
  booking.assignedAt = new Date();
  booking.assignedBy = req.user._id;

  if (booking.serviceTenant === 'GUIDE' && listingId) {
    const guide = await Guide.findById(listingId);
    if (!guide || String(guide.user) !== String(vendorId)) return error(res, 'Invalid guide listing', 400);
    booking.guide = listingId;
  } else if ((booking.serviceTenant === 'TAXI' || booking.serviceTenant === 'DRIVER') && listingId) {
    const driver = await Driver.findById(listingId);
    if (!driver || String(driver.user) !== String(vendorId)) return error(res, 'Invalid driver listing', 400);
    booking.driver = listingId;
  } else if (booking.serviceTenant === 'HORSE' && listingId) {
    const horse = await Horse.findById(listingId);
    if (!horse || String(horse.operator) !== String(vendorId)) return error(res, 'Invalid horse listing', 400);
    booking.horse = listingId;
  } else if (booking.serviceTenant === 'TENT' && listingId) {
    const tent = await Tent.findById(listingId);
    if (!tent || String(tent.operator) !== String(vendorId)) return error(res, 'Invalid tent listing', 400);
    booking.tent = listingId;
  }

  await booking.save();

  await createNotification({
    userId: vendorId,
    title: 'New booking assigned',
    message: `Booking ${booking.bookingNumber} has been assigned to you. Review and accept when ready.`,
    type: 'BOOKING',
    link: '/dashboard/vendor/bookings',
  });

  emitOpenBookingRemoved(booking);

  return success(res, booking, 'Vendor assigned');
};

async function attachVendorListingForAccept(booking, vendorId, tenant) {
  if (tenant === 'GUIDE') {
    const guide = await Guide.findOne({ user: vendorId, isActive: { $ne: false } }).sort('-createdAt');
    if (guide) booking.guide = guide._id;
  } else if (tenant === 'TAXI' || tenant === 'DRIVER') {
    const driver = await Driver.findOne({ user: vendorId, isActive: { $ne: false } }).sort('-createdAt');
    if (driver) booking.driver = driver._id;
  } else if (tenant === 'HORSE') {
    const horse = await Horse.findOne({ operator: vendorId, isActive: { $ne: false } }).sort('-createdAt');
    if (horse) booking.horse = horse._id;
  } else if (tenant === 'TENT') {
    const tent = await Tent.findOne({ operator: vendorId, isActive: { $ne: false } }).sort('-createdAt');
    if (tent) booking.tent = tent._id;
  }
}

export const getOpenServiceBookings = async (req, res) => {
  const tenant = serviceTenantForRole(req.user.role);
  if (!tenant) return error(res, 'Not a service vendor', 403);

  const bookings = await Booking.find({
    serviceTenant: tenant,
    assignmentStatus: 'UNASSIGNED',
    status: BOOKING_STATUS.PENDING,
  })
    .populate('customer', 'name phone email')
    .sort('-createdAt')
    .limit(50);

  return success(res, bookings);
};

export const acceptOpenServiceBooking = async (req, res) => {
  const tenant = serviceTenantForRole(req.user.role);
  if (!tenant) return error(res, 'Not a service vendor', 403);

  const existing = await Booking.findById(req.params.id);
  if (!existing) return error(res, 'Booking not found', 404);
  if (existing.serviceTenant !== tenant) return error(res, 'Forbidden', 403);
  if (existing.assignmentStatus !== 'UNASSIGNED') {
    return error(res, 'This booking was already accepted by another vendor', 409);
  }

  const gate = await canServiceVendorAcceptBooking(req.user._id, existing);
  if (!gate.ok) {
    return error(res, gate.reason || 'Please recharge to take this booking', 403);
  }

  const claimed = await Booking.findOneAndUpdate(
    {
      _id: req.params.id,
      assignmentStatus: 'UNASSIGNED',
      serviceTenant: tenant,
      status: BOOKING_STATUS.PENDING,
    },
    {
      vendor: req.user._id,
      assignmentStatus: 'ASSIGNED',
      assignedAt: new Date(),
      status: BOOKING_STATUS.CONFIRMED,
      notes: 'Accepted by vendor',
    },
    { new: true }
  );

  if (!claimed) {
    return error(res, 'This booking was already accepted by another vendor', 409);
  }

  await attachVendorListingForAccept(claimed, req.user._id, tenant);
  await claimed.save();

  if (gate.via === 'POINTS') {
    const deducted = await deductServicePointsForBooking(req.user._id, claimed);
    if (deducted?.ok === false) {
      await Booking.findByIdAndUpdate(claimed._id, {
        vendor: null,
        assignmentStatus: 'UNASSIGNED',
        status: BOOKING_STATUS.PENDING,
        notes: 'Awaiting vendor acceptance',
      });
      return error(res, deducted.reason || 'Please recharge to take this booking', 403);
    }
  }

  await createNotification({
    userId: claimed.customer,
    title: 'Booking confirmed',
    message: `Your booking ${claimed.bookingNumber} has been accepted by a partner.`,
    type: 'BOOKING',
    link: '/dashboard/customer/bookings',
  });

  emitOpenBookingRemoved(claimed);

  return success(res, claimed, 'Booking accepted');
};

export const getVendorMonetizationGate = async (req, res) => {
  try {
    const status = await import('../services/serviceMonetizationService.js').then((m) =>
      m.getServiceMonetizationStatus(req.user._id)
    );
    return success(res, status);
  } catch (err) {
    return error(res, err.message || 'Failed', 500);
  }
};
