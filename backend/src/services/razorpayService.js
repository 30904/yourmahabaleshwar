import crypto from 'crypto';
import Razorpay from 'razorpay';

let instance = null;

export const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
};

export const createOrder = async (amount, receipt, notes = {}) => {
  const razorpay = getRazorpay();
  if (!razorpay) {
    return { id: `order_mock_${Date.now()}`, amount: amount * 100, currency: 'INR', mock: true };
  }
  return razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt,
    notes,
  });
};

export const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    // Dev/mock mode — accept signatures starting with mock_ or any when keys absent
    return Boolean(signature);
  }
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
};

export const createRefund = async (razorpayPaymentId, amount) => {
  const razorpay = getRazorpay();
  if (!razorpay) {
    return {
      id: `rfnd_mock_${Date.now()}`,
      amount: Math.round(amount * 100),
      status: 'processed',
      mock: true,
    };
  }
  return razorpay.payments.refund(razorpayPaymentId, {
    amount: Math.round(amount * 100),
  });
};
