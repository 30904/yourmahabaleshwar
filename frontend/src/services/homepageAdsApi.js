import api from './api';
import { payWithRazorpay } from './servicePaymentHelper';

export const fetchHomepageHeroAds = () =>
  api.get('/ads/homepage-hero').then((r) => r.data.data?.items || []);

export const trackHomepageAdEvent = (adId, event = 'impression') =>
  api.post(`/ads/${adId}/track`, { event }).catch(() => null);

export const fetchVendorAdCatalog = () =>
  api.get('/ads/packages').then((r) => r.data.data);

export const fetchMyHomepageAds = () =>
  api.get('/ads/mine').then((r) => r.data.data?.items || []);

export const orderHomepageAd = (body) =>
  api.post('/ads/order', body).then((r) => r.data.data);

export const confirmHomepageAd = (body) =>
  api.post('/ads/confirm', body).then((r) => r.data.data);

export const payForHomepageAd = async ({ packageId, listingType, listingId }, user) => {
  const orderResult = await orderHomepageAd({ packageId, listingType, listingId });
  return payWithRazorpay({
    orderResult,
    user,
    description: `Homepage spotlight — ${orderResult.listing?.name || 'listing'}`,
    onSuccess: (payment) =>
      confirmHomepageAd({
        packageId,
        listingType,
        listingId,
        razorpayPaymentId: payment.razorpay_payment_id || payment.razorpayPaymentId,
        razorpayOrderId: payment.razorpay_order_id || payment.razorpayOrderId || orderResult.order?.id,
        razorpaySignature: payment.razorpay_signature || payment.razorpaySignature,
      }),
    mockConfirm: () =>
      confirmHomepageAd({
        packageId,
        listingType,
        listingId,
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        razorpayOrderId: orderResult.order?.id,
        razorpaySignature: `mock_sig_${Date.now()}`,
      }),
  });
};
