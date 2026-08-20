export const AMENITY_OPTIONS = [
  'Free WiFi',
  'Parking',
  'Swimming Pool',
  'Restaurant',
  'AC',
  'TV',
  'Breakfast',
  'Gym',
  'Spa',
  '24/7 Security',
  'Pet Friendly',
  'Smoking Area',
  'Room Service',
  'Mountain View',
  'Garden',
];

export { HOTEL_FORM_AMENITIES } from '../../constants/hotelPartnerLegal';

export const ROOM_TYPES = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'DELUXE', label: 'Deluxe' },
  { value: 'SUITE', label: 'Suite' },
  { value: 'FAMILY', label: 'Family' },
];

export const VEHICLE_TYPES = ['SEDAN', 'SUV', 'TEMPO', 'INNOVA', 'BIKE'];

export const PRODUCT_UNITS = ['pack', 'kg', 'box', 'bottle', 'jar', 'piece'];

export const VERTICAL_LABEL_KEY = {
  HOTEL: 'vendor.types.hotel',
  RESORT: 'vendor.types.resort',
  HOMESTAY: 'vendor.types.homestay',
  TENT: 'vendor.types.tent',
  GUIDE: 'vendor.types.guide',
  TAXI: 'vendor.types.driver',
  HORSE: 'vendor.types.horse',
  PRODUCT: 'vendor.types.product',
};

const splitList = (value) =>
  String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const num = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const defaultRoom = () => ({
  name: 'Standard Room',
  type: 'STANDARD',
  basePrice: 2500,
  capacity: 2,
  totalRooms: 5,
});

const defaultRoute = () => ({
  name: 'Standard ride',
  durationMinutes: 30,
  price: 800,
});

const emptyBank = () => ({
  bankName: '',
  branch: '',
  accountHolder: '',
  accountNumber: '',
  ifsc: '',
});

/** Build bookable room rows from registration inventory counts. */
export const roomsFromHotelInventory = (form) => {
  const from = num(form.priceRangeFrom) || num(form.priceRangeTo) || 2500;
  const to = num(form.priceRangeTo) || from;
  const mid = Math.round((from + to) / 2);
  const defs = [
    { key: 'nonAc', name: 'Non-AC Room', type: 'STANDARD', price: from, capacity: 2 },
    { key: 'deluxeAc', name: 'Deluxe AC Room', type: 'DELUXE', price: mid, capacity: 2 },
    { key: 'suite', name: 'Suite Room', type: 'SUITE', price: to, capacity: 3 },
    { key: 'familyDorm', name: 'Family/Dormitory Room', type: 'FAMILY', price: mid, capacity: 4 },
  ];
  const rooms = defs
    .filter((d) => num(form[d.key]) > 0)
    .map((d) => ({
      name: d.name,
      type: d.type,
      basePrice: d.price,
      capacity: d.capacity,
      totalRooms: num(form[d.key]),
    }));
  if (rooms.length) return rooms;
  const total = num(form.totalRooms);
  if (total > 0) {
    return [{ name: 'Standard Room', type: 'STANDARD', basePrice: from, capacity: 2, totalRooms: total }];
  }
  return [defaultRoom()];
};

export const defaultsFor = (vertical) => {
  const type = String(vertical || 'HOTEL').toUpperCase();
  if (type === 'HOTEL' || type === 'RESORT') {
    return {
      name: '',
      type,
      ownerName: '',
      addressLine1: '',
      city: 'Mahabaleshwar',
      pincode: '',
      receptionPhone: '',
      whatsapp: '',
      propertyEmail: '',
      website: '',
      totalRooms: '',
      nonAc: '',
      deluxeAc: '',
      suite: '',
      familyDorm: '',
      driverAccommodation: false,
      amenities: [],
      priceRangeFrom: '',
      priceRangeTo: '',
      checkInTime: '14:00',
      checkOutTime: '11:00',
      cancellationPolicyText: '',
      description: '',
      policies: '',
      imageUrl: '',
      bankName: '',
      bankBranch: '',
      accountHolder: '',
      accountNumber: '',
      ifsc: '',
      acceptTerms: false,
      acceptAgreement: false,
      acceptDeclaration: false,
      isActive: true,
      rooms: [defaultRoom()],
    };
  }
  if (type === 'HOMESTAY') {
    return {
      name: '',
      description: '',
      location: 'Mahabaleshwar',
      contactPhone: '',
      isActive: true,
      imageUrl: '',
      amenities: [],
      rooms: [defaultRoom()],
    };
  }
  if (type === 'TENT') {
    return {
      name: '',
      description: '',
      location: 'Mahabaleshwar',
      capacity: 2,
      totalTents: 10,
      pricePerNight: 1500,
      isActive: true,
      imageUrl: '',
      amenities: [],
    };
  }
  if (type === 'GUIDE') {
    return {
      name: '',
      bio: '',
      languages: 'English, Marathi',
      specialties: 'Sightseeing',
      package6hr: 1500,
      package12hr: 2500,
      bikeAddonPrice: 500,
      isActive: true,
    };
  }
  if (type === 'TAXI') {
    return {
      name: '',
      phone: '',
      vehicleType: 'SEDAN',
      vehicleNumber: '',
      perTripPrice: 1500,
      hourlyRate: 400,
      isActive: true,
    };
  }
  if (type === 'HORSE') {
    return {
      name: '',
      description: '',
      location: 'Mahabaleshwar',
      isActive: true,
      imageUrl: '',
      routes: [defaultRoute()],
    };
  }
  return {
    name: '',
    vertical: 'STRAWBERRY',
    shortDescription: '',
    price: 299,
    stock: 50,
    unit: 'pack',
    isActive: true,
    imageUrl: '',
  };
};

export const toFormValues = (vertical, doc) => {
  const type = String(vertical || '').toUpperCase();
  const base = defaultsFor(type);
  if (!doc) return base;
  if (type === 'HOTEL' || type === 'RESORT') {
    const inv = doc.roomInventory || {};
    const bank = doc.bankDetails || emptyBank();
    return {
      ...base,
      name: doc.name || '',
      type: doc.type || type,
      ownerName: doc.ownerName || '',
      addressLine1: doc.address?.line1 || '',
      city: doc.address?.city || 'Mahabaleshwar',
      pincode: doc.address?.pincode || '',
      receptionPhone: doc.receptionPhone || '',
      whatsapp: doc.whatsapp || '',
      propertyEmail: doc.propertyEmail || '',
      website: doc.website || '',
      totalRooms: inv.totalRooms ?? '',
      nonAc: inv.nonAc ?? '',
      deluxeAc: inv.deluxeAc ?? '',
      suite: inv.suite ?? '',
      familyDorm: inv.familyDorm ?? '',
      driverAccommodation: doc.driverAccommodation === true,
      amenities: Array.isArray(doc.amenities) ? doc.amenities : [],
      priceRangeFrom: doc.priceRangeFrom ?? '',
      priceRangeTo: doc.priceRangeTo ?? '',
      checkInTime: doc.checkInTime || '14:00',
      checkOutTime: doc.checkOutTime || '11:00',
      cancellationPolicyText: doc.cancellationPolicyText || '',
      description: doc.description || '',
      policies: doc.policies || '',
      imageUrl: doc.images?.[0] || '',
      bankName: bank.bankName || '',
      bankBranch: bank.branch || '',
      accountHolder: bank.accountHolder || '',
      accountNumber: bank.accountNumber || '',
      ifsc: bank.ifsc || '',
      acceptTerms: Boolean(doc.acceptedTermsAt),
      acceptAgreement: Boolean(doc.acceptedAgreementAt),
      acceptDeclaration: Boolean(doc.declarationAcceptedAt),
      isActive: doc.isActive !== false,
      approvalStatus: doc.approvalStatus,
      rooms: doc.rooms?.length
        ? doc.rooms.map((room) => ({
            name: room.name || '',
            type: room.type || 'STANDARD',
            basePrice: room.basePrice || 0,
            capacity: room.capacity ?? 2,
            totalRooms: room.totalRooms ?? 5,
          }))
        : roomsFromHotelInventory({
            priceRangeFrom: doc.priceRangeFrom,
            priceRangeTo: doc.priceRangeTo,
            totalRooms: inv.totalRooms,
            nonAc: inv.nonAc,
            deluxeAc: inv.deluxeAc,
            suite: inv.suite,
            familyDorm: inv.familyDorm,
          }),
    };
  }
  if (type === 'HOMESTAY') {
    return {
      ...base,
      name: doc.name || '',
      description: doc.description || '',
      location: doc.location || doc.address?.city || 'Mahabaleshwar',
      contactPhone: doc.contactPhone || '',
      isActive: doc.isActive !== false,
      approvalStatus: doc.approvalStatus,
      imageUrl: doc.images?.[0] || '',
      amenities: Array.isArray(doc.amenities) ? doc.amenities : [],
      rooms: doc.rooms?.length
        ? doc.rooms.map((room) => ({
            name: room.name || '',
            type: room.type || 'STANDARD',
            basePrice: room.basePrice || 0,
            capacity: room.capacity ?? 2,
            totalRooms: room.totalRooms ?? 1,
          }))
        : [defaultRoom()],
    };
  }
  if (type === 'TENT') {
    return {
      ...base,
      name: doc.name || '',
      description: doc.description || '',
      location: doc.location || 'Mahabaleshwar',
      capacity: doc.capacity ?? 2,
      totalTents: doc.totalTents ?? 10,
      pricePerNight: doc.pricePerNight || 0,
      isActive: doc.isActive !== false,
      approvalStatus: doc.approvalStatus,
      imageUrl: doc.images?.[0] || '',
      amenities: Array.isArray(doc.amenities) ? doc.amenities : [],
    };
  }
  if (type === 'GUIDE') {
    return {
      ...base,
      name: doc.name || '',
      bio: doc.bio || '',
      languages: (doc.languages || []).join(', '),
      specialties: (doc.specialties || []).join(', '),
      package6hr: doc.package6hr || 0,
      package12hr: doc.package12hr || 0,
      bikeAddonPrice: doc.bikeAddonPrice || 0,
      isActive: doc.isActive !== false,
      approvalStatus: doc.approvalStatus,
    };
  }
  if (type === 'TAXI') {
    return {
      ...base,
      name: doc.name || '',
      phone: doc.phone || '',
      vehicleType: doc.vehicleType || 'SEDAN',
      vehicleNumber: doc.vehicleNumber || '',
      perTripPrice: doc.perTripPrice || 0,
      hourlyRate: doc.hourlyRate || 0,
      isActive: doc.isActive !== false,
      approvalStatus: doc.approvalStatus,
    };
  }
  if (type === 'HORSE') {
    return {
      ...base,
      name: doc.name || '',
      description: doc.description || '',
      location: doc.location || 'Mahabaleshwar',
      isActive: doc.isActive !== false,
      approvalStatus: doc.approvalStatus,
      imageUrl: doc.images?.[0] || '',
      routes: doc.routes?.length
        ? doc.routes.map((route) => ({
            name: route.name || '',
            durationMinutes: route.durationMinutes ?? 30,
            price: route.price || 0,
          }))
        : [defaultRoute()],
    };
  }
  return {
    ...base,
    name: doc.name || '',
    vertical: doc.vertical || 'STRAWBERRY',
    shortDescription: doc.shortDescription || '',
    price: doc.price || 0,
    stock: doc.stock ?? 0,
    unit: doc.unit || 'pack',
    isActive: doc.isActive !== false,
    imageUrl: doc.images?.[0] || '',
  };
};

export const toPayload = (vertical, form) => {
  const type = String(vertical || '').toUpperCase();
  const images = form.imageUrl ? [String(form.imageUrl).trim()] : [];

  if (type === 'HOTEL' || type === 'RESORT') {
    const rooms = roomsFromHotelInventory(form);
    const now = new Date().toISOString();
    return {
      name: form.name.trim(),
      type,
      ownerName: form.ownerName?.trim(),
      description: form.description,
      address: {
        line1: form.addressLine1,
        city: form.city || 'Mahabaleshwar',
        state: 'Maharashtra',
        pincode: form.pincode,
      },
      receptionPhone: form.receptionPhone,
      whatsapp: form.whatsapp,
      propertyEmail: form.propertyEmail,
      website: form.website,
      roomInventory: {
        totalRooms: num(form.totalRooms),
        nonAc: num(form.nonAc),
        deluxeAc: num(form.deluxeAc),
        suite: num(form.suite),
        familyDorm: num(form.familyDorm),
      },
      driverAccommodation: form.driverAccommodation === true,
      amenities: form.amenities || [],
      priceRangeFrom: num(form.priceRangeFrom) || undefined,
      priceRangeTo: num(form.priceRangeTo) || undefined,
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
      cancellationPolicyText: form.cancellationPolicyText,
      policies: form.cancellationPolicyText || form.policies,
      bankDetails: {
        bankName: form.bankName,
        branch: form.bankBranch,
        accountHolder: form.accountHolder,
        accountNumber: form.accountNumber,
        ifsc: form.ifsc,
      },
      images,
      rooms,
      ...(form.acceptTerms ? { acceptedTermsAt: now } : {}),
      ...(form.acceptAgreement ? { acceptedAgreementAt: now } : {}),
      ...(form.acceptDeclaration ? { declarationAcceptedAt: now } : {}),
    };
  }

  const rooms = (form.rooms || []).map((room) => ({
    name: String(room.name || '').trim(),
    type: room.type || 'STANDARD',
    basePrice: num(room.basePrice),
    capacity: num(room.capacity, 2),
    totalRooms: num(room.totalRooms, 1),
  }));

  if (type === 'HOMESTAY') {
    const priceFrom = rooms.length ? Math.min(...rooms.map((r) => r.basePrice)) : num(form.priceFrom);
    return {
      name: form.name.trim(),
      description: form.description,
      location: form.location || 'Mahabaleshwar',
      contactPhone: form.contactPhone,
      amenities: form.amenities || [],
      isActive: form.isActive !== false,
      images,
      rooms,
      priceFrom,
    };
  }
  if (type === 'TENT') {
    return {
      name: form.name.trim(),
      description: form.description,
      location: form.location || 'Mahabaleshwar',
      capacity: num(form.capacity, 2),
      totalTents: num(form.totalTents, 1),
      pricePerNight: num(form.pricePerNight),
      amenities: form.amenities || [],
      isActive: form.isActive !== false,
      images,
    };
  }
  if (type === 'GUIDE') {
    return {
      name: form.name.trim(),
      bio: form.bio,
      languages: splitList(form.languages),
      specialties: splitList(form.specialties),
      package6hr: num(form.package6hr),
      package12hr: num(form.package12hr),
      bikeAddonPrice: num(form.bikeAddonPrice),
      isActive: form.isActive !== false,
    };
  }
  if (type === 'TAXI') {
    return {
      name: form.name.trim(),
      phone: form.phone,
      vehicleType: form.vehicleType || 'SEDAN',
      vehicleNumber: form.vehicleNumber,
      perTripPrice: num(form.perTripPrice),
      hourlyRate: num(form.hourlyRate),
      isActive: form.isActive !== false,
    };
  }
  if (type === 'HORSE') {
    const routes = (form.routes || []).map((route) => ({
      name: String(route.name || '').trim(),
      durationMinutes: num(route.durationMinutes, 30),
      price: num(route.price),
    }));
    const priceFrom = routes.length ? Math.min(...routes.map((r) => r.price)) : 0;
    return {
      name: form.name.trim(),
      description: form.description,
      location: form.location || 'Mahabaleshwar',
      isActive: form.isActive !== false,
      images,
      routes,
      priceFrom,
    };
  }
  return {
    name: form.name.trim(),
    vertical: form.vertical || 'STRAWBERRY',
    shortDescription: form.shortDescription,
    price: num(form.price),
    stock: num(form.stock),
    unit: form.unit || 'pack',
    isActive: form.isActive !== false,
    images,
  };
};

export const validateListingForm = (vertical, form, { isCreate = true } = {}) => {
  if (!String(form.name || '').trim()) return 'Property name is required';
  const type = String(vertical || '').toUpperCase();

  if (type === 'HOTEL' || type === 'RESORT') {
    if (!String(form.ownerName || '').trim()) return 'Owner/Partner name is required';
    if (!String(form.addressLine1 || '').trim()) return 'Full address is required';
    if (!String(form.receptionPhone || '').trim()) return 'Reception contact number is required';
    if (num(form.priceRangeFrom) <= 0) return 'Base price (from) must be greater than 0';
    const roomCount =
      num(form.totalRooms) + num(form.nonAc) + num(form.deluxeAc) + num(form.suite) + num(form.familyDorm);
    if (roomCount <= 0) return 'Enter at least one room count in inventory';
    if (!String(form.bankName || '').trim() || !String(form.accountNumber || '').trim() || !String(form.ifsc || '').trim()) {
      return 'Bank name, account number, and IFSC are required';
    }
    if (isCreate) {
      if (!form.acceptTerms) return 'Please accept the Terms and Conditions';
      if (!form.acceptAgreement) return 'Please accept the Partner Agreement';
      if (!form.acceptDeclaration) return 'Please accept the declaration';
    }
    return null;
  }

  if (type === 'HOMESTAY') {
    const rooms = form.rooms || [];
    if (!rooms.length || rooms.some((r) => !String(r.name || '').trim() || num(r.basePrice) <= 0)) {
      return 'Each room needs a name and a price greater than 0';
    }
  }
  if (type === 'TENT' && num(form.pricePerNight) <= 0) return 'Nightly price must be greater than 0';
  if (type === 'GUIDE' && (num(form.package6hr) <= 0 || num(form.package12hr) <= 0)) {
    return '6hr and 12hr package prices must be greater than 0';
  }
  if (type === 'TAXI' && num(form.perTripPrice) <= 0 && num(form.hourlyRate) <= 0) {
    return 'Enter a per-trip or hourly price greater than 0';
  }
  if (type === 'HORSE') {
    const routes = form.routes || [];
    if (!routes.length || routes.some((r) => !String(r.name || '').trim() || num(r.price) <= 0)) {
      return 'Each route needs a name and a price greater than 0';
    }
  }
  if (type === 'PRODUCT' && num(form.price) <= 0) return 'Price must be greater than 0';
  return null;
};

export { defaultRoom, defaultRoute };
