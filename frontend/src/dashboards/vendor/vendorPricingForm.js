const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const roomId = (row) => String(row?.id || row?._id || '');

export const pricingDraftFromListing = (vertical, doc) => {
  const type = String(vertical || '').toUpperCase();
  if (type === 'HOTEL' || type === 'RESORT') {
    return {
      rooms: (doc.rooms || []).map((room) => ({
        id: roomId(room),
        name: room.name || 'Room',
        basePrice: room.basePrice ?? '',
      })),
    };
  }
  if (type === 'HOMESTAY') {
    return {
      rooms: (doc.rooms || []).map((room) => ({
        id: roomId(room),
        name: room.name || 'Room',
        basePrice: room.basePrice ?? '',
      })),
    };
  }
  if (type === 'TENT') {
    return { pricePerNight: doc.pricePerNight ?? doc.prices?.perNight ?? '' };
  }
  if (type === 'GUIDE') {
    return {
      package6hr: doc.package6hr ?? doc.prices?.package6hr ?? '',
      package12hr: doc.package12hr ?? doc.prices?.package12hr ?? '',
      bikeAddonPrice: doc.bikeAddonPrice ?? doc.prices?.bikeAddonPrice ?? 0,
    };
  }
  if (type === 'TAXI') {
    return {
      perTripPrice: doc.perTripPrice ?? doc.prices?.perTrip ?? '',
      hourlyRate: doc.hourlyRate ?? doc.prices?.hourly ?? '',
    };
  }
  if (type === 'HORSE') {
    return {
      routes: (doc.routes || []).map((route) => ({
        id: roomId(route),
        name: route.name || 'Route',
        price: route.price ?? '',
      })),
    };
  }
  return {
    price: doc.price ?? doc.prices?.price ?? '',
    stock: doc.stock ?? doc.prices?.stock ?? 0,
  };
};

export const validatePricingDraft = (vertical, draft) => {
  const type = String(vertical || '').toUpperCase();
  const gt0 = (value, label) => {
    if (num(value) <= 0) return `${label} must be greater than 0`;
    return null;
  };
  if (type === 'HOTEL' || type === 'RESORT' || type === 'HOMESTAY') {
    if (!draft.rooms?.length) return 'Add rooms on the listing before setting prices';
    for (const room of draft.rooms) {
      const err = gt0(room.basePrice, room.name || 'Room price');
      if (err) return err;
    }
  }
  if (type === 'TENT') return gt0(draft.pricePerNight, 'Nightly price');
  if (type === 'GUIDE') {
    return gt0(draft.package6hr, '6-hour package') || gt0(draft.package12hr, '12-hour package');
  }
  if (type === 'TAXI') {
    return gt0(draft.perTripPrice, 'Per-trip fare') || gt0(draft.hourlyRate, 'Hourly rate');
  }
  if (type === 'HORSE') {
    if (!draft.routes?.length) return 'Add routes on the listing before setting prices';
    for (const route of draft.routes) {
      const err = gt0(route.price, route.name || 'Route price');
      if (err) return err;
    }
  }
  if (type === 'PRODUCT') {
    if (num(draft.price) <= 0) return 'Price must be greater than 0';
    if (num(draft.stock) < 0) return 'Stock cannot be negative';
  }
  return null;
};

export const pricingPayloadFromDraft = (vertical, draft) => {
  const type = String(vertical || '').toUpperCase();
  if (type === 'HOTEL' || type === 'RESORT' || type === 'HOMESTAY') {
    return {
      rooms: (draft.rooms || []).map((room) => ({
        id: room.id,
        basePrice: num(room.basePrice),
      })),
    };
  }
  if (type === 'TENT') return { pricePerNight: num(draft.pricePerNight) };
  if (type === 'GUIDE') {
    return {
      package6hr: num(draft.package6hr),
      package12hr: num(draft.package12hr),
      bikeAddonPrice: num(draft.bikeAddonPrice),
    };
  }
  if (type === 'TAXI') {
    return {
      perTripPrice: num(draft.perTripPrice),
      hourlyRate: num(draft.hourlyRate),
    };
  }
  if (type === 'HORSE') {
    return {
      routes: (draft.routes || []).map((route) => ({
        id: route.id,
        price: num(route.price),
      })),
    };
  }
  return { price: num(draft.price), stock: num(draft.stock) };
};
