import api from './api';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const fetchMyStaySubscriptions = () =>
  api.get('/stay-subscriptions/mine').then((r) => r.data.data?.items || []);

export const orderStaySubscriptionRenewal = (listingType, listingId) =>
  api.post(`/stay-subscriptions/${listingType}/${listingId}/renew/order`).then((r) => r.data.data);

export const confirmStaySubscriptionRenewal = (listingType, listingId, payload) =>
  api.post(`/stay-subscriptions/${listingType}/${listingId}/renew/confirm`, payload).then((r) => r.data.data);

export const payForStaySubscriptionRenewal = async (listingType, listingId, user) => {
  const result = await orderStaySubscriptionRenewal(listingType, listingId);
  if (result.renewed) return result;

  const { order, amount, keyId, listingName } = result;
  const ok = await loadRazorpayScript();

  if (!ok || order?.mock || keyId === 'mock_key') {
    await confirmStaySubscriptionRenewal(listingType, listingId, {
      razorpayPaymentId: `pay_mock_${Date.now()}`,
      razorpayOrderId: order.id,
      razorpaySignature: `mock_sig_${Date.now()}`,
    });
    return { mock: true };
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'YOURMAHABALESHWAR',
      description: `Listing subscription renewal — ${listingName || 'Stay listing'}`,
      order_id: order.id,
      prefill: {
        name: user?.name,
        email: user?.email,
        contact: user?.phone,
      },
      handler: async (response) => {
        try {
          await confirmStaySubscriptionRenewal(listingType, listingId, {
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });
          resolve(response);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });
    rzp.open();
  });
};

export const adminSetStayRenewalPrice = (listingType, listingId, renewalPrice) =>
  api
    .patch(`/admin/stay-subscriptions/${listingType}/${listingId}/renewal-price`, { renewalPrice })
    .then((r) => r.data.data);

export const adminRenewStaySubscription = (listingType, listingId, body = {}) =>
  api.post(`/admin/stay-subscriptions/${listingType}/${listingId}/renew`, body).then((r) => r.data.data);
