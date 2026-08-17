export const scoreFromRating = (rating = 4) => Math.round(Math.min(10, rating * 1.9) * 10) / 10;

export const scoreLabelFromRating = (rating = 4) => {
  if (rating >= 4.8) return 'Exceptional';
  if (rating >= 4.5) return 'Wonderful';
  if (rating >= 4.2) return 'Excellent';
  if (rating >= 3.8) return 'Very Good';
  return 'Good';
};

export const normalizeHotel = (item) => {
  if (!item) return item;
  const rating = item.rating ?? 4;
  return {
    ...item,
    priceFrom: item.priceFrom ?? item.rooms?.[0]?.basePrice ?? null,
    score: item.score ?? scoreFromRating(rating),
    scoreLabel: item.scoreLabel ?? scoreLabelFromRating(rating),
    freeCancellation: item.freeCancellation ?? true,
    payAtProperty: item.payAtProperty ?? true,
    distance: item.distance || item.address?.city || 'Mahabaleshwar',
  };
};

export const normalizeTent = (item) => {
  if (!item) return item;
  const rating = item.rating ?? 4.5;
  return {
    ...item,
    location: item.location || 'Mahabaleshwar',
    score: item.score ?? scoreFromRating(rating),
    scoreLabel: item.scoreLabel ?? scoreLabelFromRating(rating),
    freeCancellation: item.freeCancellation ?? true,
  };
};

export const normalizeGuide = (item) => {
  if (!item) return item;
  const rating = item.rating ?? 4.7;
  return {
    ...item,
    score: item.score ?? scoreFromRating(rating),
    scoreLabel: item.scoreLabel ?? scoreLabelFromRating(rating),
  };
};

export const normalizeDriver = (item) => {
  if (!item) return item;
  const rating = item.rating ?? 4.6;
  return {
    ...item,
    score: item.score ?? scoreFromRating(rating),
    scoreLabel: item.scoreLabel ?? scoreLabelFromRating(rating),
  };
};

export const normalizeHomestay = (item) => {
  if (!item) return item;
  const rating = item.rating ?? 4.3;
  return {
    ...item,
    location: item.location || item.address?.city || 'Mahabaleshwar',
    priceFrom: item.priceFrom ?? item.rooms?.[0]?.basePrice ?? null,
    score: item.score ?? scoreFromRating(rating),
    scoreLabel: item.scoreLabel ?? scoreLabelFromRating(rating),
    freeCancellation: item.freeCancellation ?? true,
  };
};

export const normalizeHorse = (item) => {
  if (!item) return item;
  const rating = item.rating ?? 4.5;
  return {
    ...item,
    location: item.location || 'Mahabaleshwar',
    priceFrom: item.priceFrom ?? item.routes?.[0]?.price ?? null,
    score: item.score ?? scoreFromRating(rating),
    scoreLabel: item.scoreLabel ?? scoreLabelFromRating(rating),
  };
};

export const extractItems = (res) => {
  const data = res?.data?.data;
  if (Array.isArray(data)) return data;
  if (data?.items) return data.items;
  return [];
};

export const bookingTitle = (b) => {
  if (b.hotel?.name) return b.hotel.name;
  if (b.homestay?.name) return b.homestay.name;
  if (b.tent?.name) return b.tent.name;
  if (b.guide?.name) return b.guide.name;
  if (b.driver?.name) return b.driver.name;
  if (b.horse?.name) return b.horse.name;
  return b.type || 'Booking';
};
