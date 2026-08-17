import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import { BOOKING_STATUS } from '../constants/booking.js';
import { createNotification } from '../services/notificationService.js';
import { generateInvoicePdf } from '../services/invoiceService.js';
import { success, error } from '../utils/apiResponse.js';

/**
 * Razorpay webhook — mount with express.raw for signature verification when possible.
 * Also accepts JSON body when RAZORPAY_WEBHOOK_SECRET is unset (dev).
 */
export const razorpayWebhook = async (req, res) => {
  try {
    let secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      try {
        const PlatformSettings = (await import('../models/PlatformSettings.js')).default;
        const settings = await PlatformSettings.findOne({ key: 'default' }).select('razorpayWebhookSecret');
        secret = settings?.razorpayWebhookSecret;
      } catch {
        /* ignore */
      }
    }
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    if (secret && signature) {
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      if (expected !== signature) {
        return error(res, 'Invalid webhook signature', 400);
      }
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventName = event?.event;
    const paymentEntity = event?.payload?.payment?.entity;

    if (eventName === 'payment.captured' && paymentEntity) {
      const orderId = paymentEntity.order_id;
      const payment = await Payment.findOne({ razorpayOrderId: orderId });
      if (payment && payment.status !== 'CAPTURED') {
        payment.razorpayPaymentId = paymentEntity.id;
        payment.status = 'CAPTURED';
        payment.method = paymentEntity.method;
        await payment.save();

        const booking = await Booking.findByIdAndUpdate(
          payment.booking,
          { paymentStatus: 'PAID', status: BOOKING_STATUS.CONFIRMED, payment: payment._id },
          { new: true }
        ).populate('customer');

        if (booking && !booking.invoiceNumber) {
          try {
            const invoice = await generateInvoicePdf({
              booking,
              customer: booking.customer,
              listingName: booking.type,
            });
            booking.invoiceNumber = invoice.invoiceNumber;
            booking.invoiceUrl = invoice.invoiceUrl;
            await booking.save();
          } catch {
            /* non-blocking */
          }
        }

        if (booking?.customer) {
          await createNotification({
            userId: booking.customer._id || booking.customer,
            title: 'Payment successful',
            message: `Payment captured for ${booking.bookingNumber}`,
            type: 'PAYMENT',
          });
        }
      }
    }

    if (eventName === 'refund.processed' && paymentEntity) {
      const payment = await Payment.findOne({ razorpayPaymentId: paymentEntity.id });
      if (payment) {
        payment.status = 'REFUNDED';
        await payment.save();
        await Booking.findByIdAndUpdate(payment.booking, {
          paymentStatus: 'REFUNDED',
          status: BOOKING_STATUS.REFUNDED,
          refundStatus: 'COMPLETED',
        });
      }
    }

    return success(res, { received: true });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
