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

export const createPaymentOrder = async (bookingId) => {
  const res = await api.post('/payments/create-order', { bookingId });
  return res.data.data;
};

export const verifyPayment = async (payload) => {
  const res = await api.post('/payments/verify', payload);
  return res.data.data;
};

export const requestRefund = async (bookingId, reason) => {
  const res = await api.post('/payments/refund', { bookingId, reason });
  return res.data.data;
};

export const getRefundPreview = async (bookingId) => {
  const res = await api.get(`/payments/refund-preview/${bookingId}`);
  return res.data.data;
};

export const payForBooking = async (booking, user) => {
  const { order, payment, keyId } = await createPaymentOrder(booking._id);
  const ok = await loadRazorpayScript();

  if (!ok || order.mock || keyId === 'mock_key') {
    await verifyPayment({
      paymentId: payment._id,
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
      description: `Booking ${booking.bookingNumber}`,
      order_id: order.id,
      prefill: {
        name: user?.name,
        email: user?.email,
        contact: user?.phone,
      },
      handler: async (response) => {
        try {
          await verifyPayment({
            paymentId: payment._id,
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
