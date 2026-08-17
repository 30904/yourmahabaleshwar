import PlatformSettings from '../models/PlatformSettings.js';
import { GST_RATE } from '../constants/booking.js';

export const getGstRate = async () => {
  const settings = await PlatformSettings.findOne({ key: 'default' });
  if (settings?.gstPercent != null) return settings.gstPercent / 100;
  return GST_RATE;
};

export const getDefaultCommissionRate = async () => {
  const settings = await PlatformSettings.findOne({ key: 'default' });
  if (settings?.commissionPercent != null) return settings.commissionPercent / 100;
  return 0.1;
};

export const calculateGST = (subtotal, rate = GST_RATE) => Math.round(subtotal * rate);

export const calculateTotal = (subtotal, gst = null, rate = GST_RATE) => {
  const gstAmount = gst ?? calculateGST(subtotal, rate);
  return { subtotal, gst: gstAmount, total: subtotal + gstAmount };
};

export const calculateTotalAsync = async (subtotal) => {
  const rate = await getGstRate();
  return calculateTotal(subtotal, null, rate);
};

export const getNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 1);
};

/** Resolve room price for a stay using seasonalPricing when overlapping. */
export const resolveRoomPrice = (room, checkIn) => {
  const date = new Date(checkIn);
  const seasons = room.seasonalPricing || [];
  for (const s of seasons) {
    if (!s.startDate || !s.endDate || s.price == null) continue;
    const start = new Date(s.startDate);
    const end = new Date(s.endDate);
    if (date >= start && date <= end) return s.price;
  }
  return room.basePrice;
};
