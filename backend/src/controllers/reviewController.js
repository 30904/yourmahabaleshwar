import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import Tent from '../models/Tent.js';
import Guide from '../models/Guide.js';
import Driver from '../models/Driver.js';
import Homestay from '../models/Homestay.js';
import Horse from '../models/Horse.js';
import { BOOKING_STATUS } from '../constants/booking.js';
import { ROLES } from '../constants/roles.js';
import { success, error } from '../utils/apiResponse.js';

const listingModels = {
  HOTEL: Hotel,
  RESORT: Hotel,
  TENT: Tent,
  GUIDE: Guide,
  TAXI: Driver,
  HOMESTAY: Homestay,
  HORSE: Horse,
};

const fieldByType = {
  HOTEL: 'hotel',
  RESORT: 'hotel',
  TENT: 'tent',
  GUIDE: 'guide',
  TAXI: 'driver',
  HOMESTAY: 'homestay',
  HORSE: 'horse',
};

const updateListingRating = async (listingType, listingId) => {
  const field = fieldByType[listingType];
  if (!field) return;
  const approved = await Review.find({ [field]: listingId, isApproved: true });
  if (!approved.length) return;
  const avg = approved.reduce((s, r) => s + r.rating, 0) / approved.length;
  const Model = listingModels[listingType];
  if (Model) {
    await Model.findByIdAndUpdate(listingId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: approved.length,
    });
  }
};

export const createReview = async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return error(res, 'Booking not found', 404);
  if (String(booking.customer) !== String(req.user._id)) return error(res, 'Forbidden', 403);
  if (booking.status !== BOOKING_STATUS.COMPLETED && booking.paymentStatus !== 'PAID') {
    return error(res, 'Reviews allowed after completed/paid bookings', 400);
  }

  const payload = {
    user: req.user._id,
    booking: bookingId,
    rating,
    comment,
    listingType: booking.type,
  };

  if (booking.hotel) payload.hotel = booking.hotel;
  if (booking.tent) payload.tent = booking.tent;
  if (booking.guide) payload.guide = booking.guide;
  if (booking.driver) payload.driver = booking.driver;
  if (booking.homestay) payload.homestay = booking.homestay;
  if (booking.horse) payload.horse = booking.horse;

  try {
    const review = await Review.create(payload);
    return success(res, review, 'Review submitted for moderation', 201);
  } catch (err) {
    if (err.code === 11000) return error(res, 'You already reviewed this booking', 400);
    return error(res, err.message, 400);
  }
};

export const listReviews = async (req, res) => {
  const { listingType, listingId } = req.query;
  const filter = { isApproved: true };
  if (listingType && listingId) {
    const field = fieldByType[listingType];
    if (field) filter[field] = listingId;
  }
  const reviews = await Review.find(filter)
    .populate('user', 'name avatar')
    .sort('-createdAt')
    .limit(100);
  return success(res, reviews);
};

const none = { _id: { $in: [] } };

const vendorReviewFilter = async (user) => {
  const owner = user._id;
  const role = user.role;
  const or = [];

  if (role === ROLES.HOTEL_VENDOR) {
    const ids = await Hotel.find({ vendor: owner }).distinct('_id');
    if (ids.length) or.push({ hotel: { $in: ids } });
  } else if (role === ROLES.HOMESTAY_VENDOR) {
    const ids = await Homestay.find({ vendor: owner }).distinct('_id');
    if (ids.length) or.push({ homestay: { $in: ids } });
  } else if (role === ROLES.TENT_OPERATOR) {
    const ids = await Tent.find({ operator: owner }).distinct('_id');
    if (ids.length) or.push({ tent: { $in: ids } });
  } else if (role === ROLES.HORSE_OPERATOR) {
    const ids = await Horse.find({ operator: owner }).distinct('_id');
    if (ids.length) or.push({ horse: { $in: ids } });
  } else if (role === ROLES.GUIDE) {
    const ids = await Guide.find({ user: owner }).distinct('_id');
    if (ids.length) or.push({ guide: { $in: ids } });
  } else if (role === ROLES.DRIVER) {
    const ids = await Driver.find({ user: owner }).distinct('_id');
    if (ids.length) or.push({ driver: { $in: ids } });
  }

  return or.length ? { $or: or } : none;
};

const listingDocOf = (review) =>
  review.hotel || review.tent || review.guide || review.driver || review.homestay || review.horse;

export const listVendorReviews = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const filter = await vendorReviewFilter(req.user);

  const [raw, total] = await Promise.all([
    Review.find(filter)
      .populate('booking', 'bookingNumber')
      .populate('hotel', 'name')
      .populate('tent', 'name')
      .populate('guide', 'name')
      .populate('driver', 'name')
      .populate('homestay', 'name')
      .populate('horse', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  const items = raw.map((review) => {
    const listing = listingDocOf(review);
    return {
      id: String(review._id),
      listingId: listing ? String(listing._id || listing) : null,
      listingName: listing?.name || '',
      listingType: review.listingType,
      rating: review.rating,
      comment: review.comment || '',
      bookingRef: review.booking?.bookingNumber || null,
      isApproved: !!review.isApproved,
      createdAt: review.createdAt,
    };
  });

  return success(res, {
    items,
    total,
    page,
    pages: Math.ceil(total / limit) || 0,
  });
};

export const listPendingReviews = async (req, res) => {
  const reviews = await Review.find({ isApproved: false })
    .populate('user', 'name email')
    .sort('-createdAt')
    .limit(200);
  return success(res, reviews);
};

export const moderateReview = async (req, res) => {
  const { approve } = req.body;
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved: !!approve },
    { new: true }
  );
  if (!review) return error(res, 'Review not found', 404);
  if (review.isApproved && review.listingType) {
    const id =
      review.hotel || review.tent || review.guide || review.driver || review.homestay || review.horse;
    await updateListingRating(review.listingType, id);
  }
  return success(res, review, approve ? 'Review approved' : 'Review rejected');
};
