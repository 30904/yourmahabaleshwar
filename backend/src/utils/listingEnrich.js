import Room from '../models/Room.js';

export const scoreFromRating = (rating = 4) => Math.round(Math.min(10, rating * 1.9) * 10) / 10;

export const scoreLabelFromRating = (rating = 4) => {
  if (rating >= 4.8) return 'Exceptional';
  if (rating >= 4.5) return 'Wonderful';
  if (rating >= 4.2) return 'Excellent';
  if (rating >= 3.8) return 'Very Good';
  return 'Good';
};

export const enrichHotel = (hotel, priceFrom) => {
  const obj = hotel.toObject ? hotel.toObject() : { ...hotel };
  const rating = obj.rating ?? 4;
  return {
    ...obj,
    priceFrom: priceFrom ?? obj.priceFrom ?? null,
    score: obj.score ?? scoreFromRating(rating),
    scoreLabel: obj.scoreLabel ?? scoreLabelFromRating(rating),
    freeCancellation: obj.freeCancellation ?? true,
    payAtProperty: obj.payAtProperty ?? true,
    distance: obj.distance || `${obj.address?.city || 'Mahabaleshwar'}`,
  };
};

export const enrichTent = (tent) => {
  const obj = tent.toObject ? tent.toObject() : { ...tent };
  const rating = obj.rating ?? 4.5;
  return {
    ...obj,
    location: obj.location || obj.address?.city || 'Mahabaleshwar',
    score: obj.score ?? scoreFromRating(rating),
    scoreLabel: obj.scoreLabel ?? scoreLabelFromRating(rating),
    freeCancellation: obj.freeCancellation ?? true,
  };
};

export const enrichGuide = (guide) => {
  const obj = guide.toObject ? guide.toObject() : { ...guide };
  const rating = obj.rating ?? 4.7;
  return {
    ...obj,
    score: obj.score ?? scoreFromRating(rating),
    scoreLabel: obj.scoreLabel ?? scoreLabelFromRating(rating),
  };
};

export const enrichDriver = (driver) => {
  const obj = driver.toObject ? driver.toObject() : { ...driver };
  const rating = obj.rating ?? 4.6;
  return {
    ...obj,
    score: obj.score ?? scoreFromRating(rating),
    scoreLabel: obj.scoreLabel ?? scoreLabelFromRating(rating),
  };
};

export const enrichHomestay = (item) => {
  const obj = item.toObject ? item.toObject() : { ...item };
  const rating = obj.rating ?? 4.3;
  return {
    ...obj,
    location: obj.location || obj.address?.city || 'Mahabaleshwar',
    priceFrom: obj.priceFrom ?? (obj.rooms?.[0]?.basePrice ?? null),
    score: obj.score ?? scoreFromRating(rating),
    scoreLabel: obj.scoreLabel ?? scoreLabelFromRating(rating),
    freeCancellation: obj.freeCancellation ?? true,
  };
};

export const enrichHorse = (item) => {
  const obj = item.toObject ? item.toObject() : { ...item };
  const rating = obj.rating ?? 4.5;
  return {
    ...obj,
    location: obj.location || 'Mahabaleshwar',
    priceFrom: obj.priceFrom ?? (obj.routes?.[0]?.price ?? null),
    score: obj.score ?? scoreFromRating(rating),
    scoreLabel: obj.scoreLabel ?? scoreLabelFromRating(rating),
  };
};

export const attachHotelPrices = async (hotels) => {
  if (!hotels.length) return [];
  const ids = hotels.map((h) => h._id);
  const mins = await Room.aggregate([
    { $match: { hotel: { $in: ids }, isActive: { $ne: false } } },
    { $group: { _id: '$hotel', priceFrom: { $min: '$basePrice' } } },
  ]);
  const map = Object.fromEntries(mins.map((m) => [m._id.toString(), m.priceFrom]));
  return hotels.map((h) => enrichHotel(h, map[h._id.toString()]));
};
