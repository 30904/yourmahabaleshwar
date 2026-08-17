import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import Homestay from '../models/Homestay.js';
import Tent from '../models/Tent.js';
import PlatformSettings from '../models/PlatformSettings.js';
import User from '../models/User.js';
import { createOrder, verifyPaymentSignature, createRefund } from '../services/razorpayService.js';
import { generateInvoicePdf } from '../services/invoiceService.js';
import { createNotification } from '../services/notificationService.js';
import { BOOKING_STATUS, REFUND_STATUS } from '../constants/booking.js';
import { success, error } from '../utils/apiResponse.js';

const hoursUntil = (date) => (new Date(date) - Date.now()) / 3600000;

const resolveCancellationPolicy = async (booking) => {
  if (booking.homestay) {
    const hs = await Homestay.findById(booking.homestay);
    if (hs?.cancellationPolicy) return hs.cancellationPolicy;
  }
  if (booking.tent) {
    const tent = await Tent.findById(booking.tent);
    if (tent?.cancellationPolicy) return tent.cancellationPolicy;
  }
  if (booking.hotel) {
    const hotel = await Hotel.findById(booking.hotel);
    if (hotel?.cancellationPolicy) return hotel.cancellationPolicy;
  }
  const settings = await PlatformSettings.findOne({ key: 'default' });
  return (
    settings?.defaultCancellationPolicy || {
      freeCancellationHours: 48,
      partialRefundPercent: 50,
      noRefundHours: 24,
    }
  );
};

export const computeRefundAmount = async (booking) => {
  const policy = await resolveCancellationPolicy(booking);
  const hours = hoursUntil(booking.checkIn || booking.createdAt);
  if (hours >= (policy.freeCancellationHours ?? 48)) {
    return { amount: booking.total, type: 'FULL' };
  }
  if (hours >= (policy.noRefundHours ?? 24)) {
    const pct = policy.partialRefundPercent ?? 50;
    return { amount: Math.round((booking.total * pct) / 100), type: 'PARTIAL' };
  }
  return { amount: 0, type: 'NONE' };
};

export const createPaymentOrder = async (req, res) => {
  const { bookingId } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return error(res, 'Booking not found', 404);
  if (String(booking.customer) !== String(req.user._id) && req.user.role !== 'SUPER_ADMIN') {
    return error(res, 'Forbidden', 403);
  }
  const order = await createOrder(booking.total, booking.bookingNumber, { bookingId });
  const payment = await Payment.create({
    booking: bookingId,
    user: req.user._id,
    amount: booking.total,
    razorpayOrderId: order.id,
    status: 'CREATED',
  });
  return success(res, { order, payment, keyId: process.env.RAZORPAY_KEY_ID || 'mock_key' });
};

export const verifyPayment = async (req, res) => {
  const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
  const payment = await Payment.findById(paymentId);
  if (!payment) return error(res, 'Payment not found', 404);

  const valid = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!valid) return error(res, 'Invalid payment signature', 400);

  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpayOrderId = razorpayOrderId;
  payment.razorpaySignature = razorpaySignature;
  payment.status = 'CAPTURED';
  await payment.save();

  const booking = await Booking.findByIdAndUpdate(
    payment.booking,
    {
      paymentStatus: 'PAID',
      status: BOOKING_STATUS.CONFIRMED,
      payment: payment._id,
    },
    { new: true }
  ).populate('customer vendor hotel tent guide driver homestay horse');

  if (booking && !booking.invoiceNumber) {
    try {
      const listingName =
        booking.hotel?.name ||
        booking.homestay?.name ||
        booking.tent?.name ||
        booking.guide?.name ||
        booking.driver?.name ||
        booking.horse?.name ||
        booking.type;
      const gstNumber = booking.hotel?.gstNumber || booking.homestay?.gstNumber;
      const invoice = await generateInvoicePdf({
        booking,
        customer: booking.customer,
        vendor: booking.vendor,
        listingName,
        gstNumber,
      });
      booking.invoiceNumber = invoice.invoiceNumber;
      booking.invoiceUrl = invoice.invoiceUrl;
      await booking.save();
    } catch {
      /* invoice non-blocking */
    }
  }

  if (booking?.customer) {
    await createNotification({
      userId: booking.customer._id || booking.customer,
      title: 'Payment successful',
      message: `Payment received for booking ${booking.bookingNumber}.`,
      type: 'PAYMENT',
      link: '/dashboard/customer/bookings',
      email: booking.customer.email,
      phone: booking.customer.phone,
      sendMail: true,
      sendSms: true,
    });
  }
  if (booking?.vendor) {
    await createNotification({
      userId: booking.vendor._id || booking.vendor,
      title: 'New paid booking',
      message: `Booking ${booking.bookingNumber} is confirmed and paid.`,
      type: 'BOOKING',
      link: '/dashboard/vendor/bookings',
    });
  }

  return success(res, { payment, booking }, 'Payment verified');
};

export const requestRefund = async (req, res) => {
  const { bookingId, reason } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return error(res, 'Booking not found', 404);
  if (String(booking.customer) !== String(req.user._id) && req.user.role !== 'SUPER_ADMIN') {
    return error(res, 'Forbidden', 403);
  }
  if (booking.paymentStatus !== 'PAID' && booking.paymentStatus !== 'PARTIAL_REFUND') {
    return error(res, 'Booking is not paid', 400);
  }

  const { amount, type } = await computeRefundAmount(booking);
  booking.refundStatus = REFUND_STATUS.REQUESTED;
  booking.refundReason = reason;
  booking.cancellationReason = reason;
  booking.cancelledAt = new Date();
  booking.status = BOOKING_STATUS.CANCELLED;
  await booking.save();

  if (amount <= 0 || type === 'NONE') {
    booking.refundStatus = REFUND_STATUS.REJECTED;
    booking.refundAmount = 0;
    await booking.save();
    await createNotification({
      userId: booking.customer,
      title: 'Refund not applicable',
      message: `Cancellation accepted for ${booking.bookingNumber} but refund is not available per policy.`,
      type: 'PAYMENT',
    });
    return success(res, { booking, refundAmount: 0, refundType: type }, 'Cancelled — no refund');
  }

  const payment = await Payment.findById(booking.payment);
  if (!payment?.razorpayPaymentId) {
    booking.refundStatus = REFUND_STATUS.PROCESSING;
    booking.refundAmount = amount;
    await booking.save();
    return success(res, { booking, refundAmount: amount, refundType: type }, 'Refund requested');
  }

  try {
    const refund = await createRefund(payment.razorpayPaymentId, amount);
    payment.razorpayRefundId = refund.id;
    payment.refundedAmount = (payment.refundedAmount || 0) + amount;
    payment.status = amount >= payment.amount ? 'REFUNDED' : 'PARTIAL_REFUND';
    await payment.save();

    booking.refundAmount = amount;
    booking.refundStatus = REFUND_STATUS.COMPLETED;
    booking.paymentStatus = amount >= booking.total ? 'REFUNDED' : 'PARTIAL_REFUND';
    booking.status = BOOKING_STATUS.REFUNDED;
    await booking.save();

    await createNotification({
      userId: booking.customer,
      title: 'Refund processed',
      message: `Refund of INR ${amount} for booking ${booking.bookingNumber} has been processed.`,
      type: 'PAYMENT',
      sendMail: true,
      email: (await User.findById(booking.customer))?.email,
    });

    return success(res, { booking, payment, refund, refundType: type }, 'Refund processed');
  } catch (err) {
    booking.refundStatus = REFUND_STATUS.PROCESSING;
    booking.refundAmount = amount;
    await booking.save();
    return error(res, err.message || 'Refund failed', 500);
  }
};

export const getRefundPreview = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return error(res, 'Booking not found', 404);
  const preview = await computeRefundAmount(booking);
  return success(res, preview);
};
