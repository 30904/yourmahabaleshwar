import api from './api';
import { payWithRazorpay } from './servicePaymentHelper';

export const fetchMyServiceMonetization = () =>
  api.get('/service-monetization/me').then((r) => r.data.data);

export const orderServicePointsRecharge = (amount) =>
  api.post('/service-monetization/points/order', { amount }).then((r) => r.data.data);

export const confirmServicePointsRecharge = (payload) =>
  api.post('/service-monetization/points/confirm', payload).then((r) => r.data.data);

export const orderServiceUnlimitedMonthly = () =>
  api.post('/service-monetization/unlimited/order').then((r) => r.data.data);

export const confirmServiceUnlimitedMonthly = (payload) =>
  api.post('/service-monetization/unlimited/confirm', payload).then((r) => r.data.data);

export const payForServicePoints = async (amount, user) => {
  const orderResult = await orderServicePointsRecharge(amount);
  await payWithRazorpay({
    orderResult,
    user,
    description: 'Points recharge',
    onSuccess: (payment) =>
      confirmServicePointsRecharge({
        amount,
        razorpayPaymentId: payment.razorpay_payment_id || payment.razorpayPaymentId,
        razorpayOrderId: payment.razorpay_order_id || payment.razorpayOrderId || orderResult.order?.id,
        razorpaySignature: payment.razorpay_signature || payment.razorpaySignature,
      }),
    mockConfirm: () =>
      confirmServicePointsRecharge({
        amount,
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        razorpayOrderId: orderResult.order?.id,
        razorpaySignature: `mock_sig_${Date.now()}`,
      }),
  });
};

export const payForServiceUnlimited = async (user) => {
  const orderResult = await orderServiceUnlimitedMonthly();
  await payWithRazorpay({
    orderResult,
    user,
    description: 'Unlimited monthly bookings',
    onSuccess: (payment) =>
      confirmServiceUnlimitedMonthly({
        razorpayPaymentId: payment.razorpay_payment_id || payment.razorpayPaymentId,
        razorpayOrderId: payment.razorpay_order_id || payment.razorpayOrderId || orderResult.order?.id,
        razorpaySignature: payment.razorpay_signature || payment.razorpaySignature,
      }),
    mockConfirm: () =>
      confirmServiceUnlimitedMonthly({
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        razorpayOrderId: orderResult.order?.id,
        razorpaySignature: `mock_sig_${Date.now()}`,
      }),
  });
};

export const fetchServiceMonetizationAdmin = () =>
  api.get('/admin/service-monetization').then((r) => r.data.data);

export const updateServiceMonetizationAdmin = (tenantType, body) =>
  api.patch(`/admin/service-monetization/${tenantType}`, body).then((r) => r.data.data);

export const assignBookingVendor = (bookingId, body) =>
  api.patch(`/bookings/${bookingId}/assign`, body).then((r) => r.data.data);

export const fetchVendorMonetizationGate = () =>
  api.get('/bookings/vendor/monetization-gate').then((r) => r.data.data);
