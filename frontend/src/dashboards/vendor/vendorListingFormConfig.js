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
  TAXI: 'vendor.types.taxi',
  DRIVER: 'vendor.types.driver',
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
      imageUrl: '',
      bankName: '',
      bankBranch: '',
      accountHolder: '',
      accountNumber: '',
      ifsc: '',
      acceptTerms: false,
      acceptDeclaration: false,
      isActive: true,
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
      gender: '',
      fatherOrHusbandName: '',
      dateOfBirth: '',
      addressLine1: '',
      pincode: '',
      primaryMobile: '',
      alternateMobile: '',
      whatsapp: '',
      email: '',
      emergencyContactName: '',
      emergencyContactMobile: '',
      ownsTwoWheeler: '',
      ownsFourWheeler: '',
      drivingSkill: '',
      licenseType: '',
      drivingLicenseNumber: '',
      experience: 1,
      mainTourismArea: 'Mahabaleshwar',
      languages: ['Marathi', 'English'],
      otherLanguages: '',
      specialties: 'Sightseeing',
      bio: '',
      package6hr: 1500,
      package12hr: 2500,
      bikeAddonPrice: 500,
      imageUrl: '',
      bankName: '',
      bankBranch: '',
      accountHolder: '',
      accountNumber: '',
      ifsc: '',
      acceptTerms: false,
      acceptDeclaration: false,
      isActive: true,
    };
  }
  if (type === 'TAXI') {
    return {
      name: '',
      operatorName: '',
      gender: '',
      fatherOrHusbandName: '',
      dateOfBirth: '',
      addressLine1: '',
      pincode: '',
      primaryMobile: '',
      alternateMobile: '',
      whatsapp: '',
      email: '',
      emergencyContactName: '',
      emergencyContactMobile: '',
      vehicleType: 'INNOVA',
      vehicleNumber: '',
      licenseType: 'COMMERCIAL',
      drivingLicenseNumber: '',
      experience: 1,
      serviceArea: 'Mahabaleshwar, Panchgani, Pune transfers',
      perTripPrice: 1500,
      hourlyRate: 400,
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
    };
  }
  if (type === 'DRIVER') {
    return {
      name: '',
      gender: '',
      fatherOrHusbandName: '',
      dateOfBirth: '',
      addressLine1: '',
      pincode: '',
      primaryMobile: '',
      alternateMobile: '',
      whatsapp: '',
      email: '',
      emergencyContactName: '',
      emergencyContactMobile: '',
      vehicleType: 'SEDAN',
      vehicleNumber: '',
      licenseType: '',
      drivingLicenseNumber: '',
      experience: 1,
      serviceArea: 'Mahabaleshwar',
      perTripPrice: 1200,
      hourlyRate: 350,
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
    };
  }
  if (type === 'HORSE') {
    return {
      name: '',
      operatorName: '',
      gender: '',
      fatherOrHusbandName: '',
      dateOfBirth: '',
      addressLine1: '',
      pincode: '',
      primaryMobile: '',
      alternateMobile: '',
      whatsapp: '',
      email: '',
      emergencyName: '',
      emergencyMobile: '',
      description: '',
      horseDetails: '',
      location: 'Mahabaleshwar',
      serviceArea: 'Mahabaleshwar',
      horseCount: 1,
      safetyGearProvided: true,
      experience: 1,
      slotsPerDay: 8,
      isActive: true,
      imageUrl: '',
      routes: [defaultRoute()],
      bankName: '',
      bankBranch: '',
      accountHolder: '',
      accountNumber: '',
      ifsc: '',
      acceptTerms: false,
      acceptAgreement: false,
      acceptDeclaration: false,
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
    const inv = doc.roomInventory || {};
    const bank = doc.bankDetails || emptyBank();
    return {
      ...base,
      name: doc.name || '',
      ownerName: doc.ownerName || '',
      addressLine1: doc.address?.line1 || '',
      city: doc.address?.city || doc.location || 'Mahabaleshwar',
      pincode: doc.address?.pincode || '',
      receptionPhone: doc.receptionPhone || doc.contactPhone || '',
      whatsapp: doc.whatsapp || '',
      propertyEmail: doc.propertyEmail || doc.contactEmail || '',
      website: doc.website || '',
      totalRooms: inv.totalRooms ?? '',
      nonAc: inv.nonAc ?? '',
      deluxeAc: inv.deluxeAc ?? '',
      suite: inv.suite ?? '',
      familyDorm: inv.familyDorm ?? '',
      driverAccommodation: doc.driverAccommodation === true,
      amenities: Array.isArray(doc.amenities) ? doc.amenities : [],
      priceRangeFrom: doc.priceRangeFrom ?? doc.priceFrom ?? '',
      priceRangeTo: doc.priceRangeTo ?? '',
      checkInTime: doc.checkInTime || '14:00',
      checkOutTime: doc.checkOutTime || '11:00',
      cancellationPolicyText: doc.cancellationPolicyText || '',
      description: doc.description || '',
      imageUrl: doc.images?.[0] || '',
      bankName: bank.bankName || '',
      bankBranch: bank.branch || '',
      accountHolder: bank.accountHolder || '',
      accountNumber: bank.accountNumber || '',
      ifsc: bank.ifsc || '',
      acceptTerms: Boolean(doc.acceptedTermsAt),
      acceptDeclaration: Boolean(doc.declarationAcceptedAt),
      isActive: doc.isActive !== false,
      approvalStatus: doc.approvalStatus,
      rooms: doc.rooms?.length
        ? doc.rooms.map((room) => ({
            name: room.name || '',
            type: room.type || 'STANDARD',
            basePrice: room.basePrice || 0,
            capacity: room.capacity ?? 2,
            totalRooms: room.totalRooms ?? 1,
          }))
        : roomsFromHotelInventory({
            priceRangeFrom: doc.priceRangeFrom ?? doc.priceFrom,
            priceRangeTo: doc.priceRangeTo,
            totalRooms: inv.totalRooms,
            nonAc: inv.nonAc,
            deluxeAc: inv.deluxeAc,
            suite: inv.suite,
            familyDorm: inv.familyDorm,
          }),
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
    const bank = doc.bankDetails || emptyBank();
    const contact = doc.contact || {};
    const vehicle = doc.vehicle || {};
    const presetLangs = (doc.languages || []).filter((l) => ['Marathi', 'Hindi', 'English'].includes(l));
    const otherLangs = [
      ...(doc.otherLanguages || []),
      ...(doc.languages || []).filter((l) => !['Marathi', 'Hindi', 'English'].includes(l)),
    ];
    return {
      ...base,
      name: doc.name || '',
      gender: doc.gender || '',
      fatherOrHusbandName: doc.fatherOrHusbandName || '',
      dateOfBirth: doc.dateOfBirth ? String(doc.dateOfBirth).slice(0, 10) : '',
      addressLine1: doc.address?.line1 || '',
      pincode: doc.address?.pincode || '',
      primaryMobile: contact.primaryMobile || '',
      alternateMobile: contact.alternateMobile || '',
      whatsapp: contact.whatsapp || '',
      email: contact.email || '',
      emergencyContactName: contact.emergencyName || '',
      emergencyContactMobile: contact.emergencyMobile || '',
      ownsTwoWheeler: vehicle.ownsTwoWheeler === true ? 'yes' : vehicle.ownsTwoWheeler === false ? 'no' : '',
      ownsFourWheeler: vehicle.ownsFourWheeler === true ? 'yes' : vehicle.ownsFourWheeler === false ? 'no' : '',
      drivingSkill: vehicle.drivingSkill || '',
      licenseType: vehicle.licenseType || '',
      drivingLicenseNumber: vehicle.licenseNumber || '',
      experience: doc.experience ?? 1,
      mainTourismArea: doc.mainTourismArea || '',
      languages: presetLangs.length ? presetLangs : base.languages,
      otherLanguages: otherLangs.join(', '),
      specialties: (doc.specialties || []).join(', '),
      bio: doc.bio || '',
      package6hr: doc.package6hr || 0,
      package12hr: doc.package12hr || 0,
      bikeAddonPrice: doc.bikeAddonPrice || 0,
      imageUrl: doc.photo || doc.images?.[0] || '',
      bankName: bank.bankName || '',
      bankBranch: bank.branch || '',
      accountHolder: bank.accountHolder || '',
      accountNumber: bank.accountNumber || '',
      ifsc: bank.ifsc || '',
      acceptTerms: Boolean(doc.acceptedTermsAt),
      acceptDeclaration: Boolean(doc.declarationAcceptedAt),
      isActive: doc.isActive !== false,
      approvalStatus: doc.approvalStatus,
    };
  }
  if (type === 'TAXI' || type === 'DRIVER') {
    const bank = doc.bankDetails || emptyBank();
    const contact = doc.contact || {};
    const vehicle = doc.vehicle || {};
    return {
      ...base,
      name: doc.name || '',
      operatorName: doc.operatorName || '',
      gender: doc.gender || '',
      fatherOrHusbandName: doc.fatherOrHusbandName || '',
      dateOfBirth: doc.dateOfBirth ? String(doc.dateOfBirth).slice(0, 10) : '',
      addressLine1: doc.address?.line1 || '',
      pincode: doc.address?.pincode || '',
      primaryMobile: contact.primaryMobile || doc.phone || '',
      alternateMobile: contact.alternateMobile || '',
      whatsapp: contact.whatsapp || '',
      email: contact.email || '',
      emergencyContactName: contact.emergencyName || '',
      emergencyContactMobile: contact.emergencyMobile || '',
      vehicleType: doc.vehicleType || (type === 'TAXI' ? 'INNOVA' : 'SEDAN'),
      vehicleNumber: doc.vehicleNumber || '',
      licenseType: vehicle.licenseType || '',
      drivingLicenseNumber: vehicle.licenseNumber || '',
      experience: doc.experience ?? 1,
      serviceArea: doc.serviceArea || (type === 'TAXI' ? 'Mahabaleshwar, Panchgani, Pune transfers' : 'Mahabaleshwar'),
      perTripPrice: doc.perTripPrice || 0,
      hourlyRate: doc.hourlyRate || 0,
      imageUrl: doc.photo || doc.images?.[0] || '',
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
    };
  }
  if (type === 'HORSE') {
    const bank = doc.bankDetails || emptyBank();
    const contact = doc.contact || {};
    const stable = doc.stable || {};
    return {
      ...base,
      name: doc.name || '',
      operatorName: doc.operatorName || '',
      gender: doc.gender || '',
      fatherOrHusbandName: doc.fatherOrHusbandName || '',
      dateOfBirth: doc.dateOfBirth ? String(doc.dateOfBirth).slice(0, 10) : '',
      addressLine1: doc.address?.line1 || '',
      pincode: doc.address?.pincode || '',
      primaryMobile: contact.primaryMobile || doc.contactPhone || '',
      alternateMobile: contact.alternateMobile || '',
      whatsapp: contact.whatsapp || '',
      email: contact.email || '',
      emergencyName: contact.emergencyName || '',
      emergencyMobile: contact.emergencyMobile || '',
      description: doc.description || '',
      horseDetails: doc.horseDetails || '',
      location: doc.location || 'Mahabaleshwar',
      serviceArea: stable.serviceArea || doc.location || 'Mahabaleshwar',
      horseCount: stable.horseCount ?? 1,
      safetyGearProvided: stable.safetyGearProvided !== false,
      experience: stable.experience ?? doc.experience ?? 1,
      slotsPerDay: doc.availability?.slotsPerDay ?? 8,
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
      bankName: bank.bankName || '',
      bankBranch: bank.branch || '',
      accountHolder: bank.accountHolder || '',
      accountNumber: bank.accountNumber || '',
      ifsc: bank.ifsc || '',
      acceptTerms: Boolean(doc.acceptedTermsAt),
      acceptAgreement: Boolean(doc.acceptedAgreementAt),
      acceptDeclaration: Boolean(doc.declarationAcceptedAt),
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

  if (type === 'HOMESTAY') {
    const rooms = roomsFromHotelInventory(form);
    const now = new Date().toISOString();
    const priceFrom = num(form.priceRangeFrom) || (rooms.length ? Math.min(...rooms.map((r) => r.basePrice)) : undefined);
    return {
      name: form.name.trim(),
      ownerName: form.ownerName?.trim(),
      description: form.description,
      location: form.city || 'Mahabaleshwar',
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
      contactPhone: form.receptionPhone,
      contactEmail: form.propertyEmail,
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
      priceFrom,
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
      cancellationPolicyText: form.cancellationPolicyText,
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
    const now = new Date().toISOString();
    const presetLangs = Array.isArray(form.languages) ? form.languages : splitList(form.languages);
    const otherLangs = splitList(form.otherLanguages);
    const images = form.imageUrl ? [form.imageUrl] : [];
    return {
      name: form.name.trim(),
      gender: form.gender || undefined,
      fatherOrHusbandName: form.fatherOrHusbandName?.trim(),
      dateOfBirth: form.dateOfBirth || undefined,
      address: {
        line1: form.addressLine1,
        pincode: form.pincode,
      },
      contact: {
        primaryMobile: form.primaryMobile,
        alternateMobile: form.alternateMobile,
        whatsapp: form.whatsapp,
        email: form.email,
        emergencyName: form.emergencyContactName,
        emergencyMobile: form.emergencyContactMobile,
      },
      vehicle: {
        ownsTwoWheeler: form.ownsTwoWheeler === 'yes' ? true : form.ownsTwoWheeler === 'no' ? false : undefined,
        ownsFourWheeler: form.ownsFourWheeler === 'yes' ? true : form.ownsFourWheeler === 'no' ? false : undefined,
        drivingSkill: form.drivingSkill || undefined,
        licenseNumber: form.drivingLicenseNumber,
        licenseType: form.licenseType || undefined,
      },
      bio: form.bio,
      languages: presetLangs,
      otherLanguages: otherLangs,
      specialties: splitList(form.specialties),
      mainTourismArea: form.mainTourismArea?.trim(),
      experience: num(form.experience, 1),
      package6hr: num(form.package6hr),
      package12hr: num(form.package12hr),
      bikeAddonPrice: num(form.bikeAddonPrice),
      photo: form.imageUrl || undefined,
      images,
      bankDetails: {
        bankName: form.bankName,
        branch: form.bankBranch,
        accountHolder: form.accountHolder,
        accountNumber: form.accountNumber,
        ifsc: form.ifsc,
      },
      ...(form.acceptTerms ? { acceptedTermsAt: now } : {}),
      ...(form.acceptDeclaration ? { declarationAcceptedAt: now } : {}),
    };
  }
  if (type === 'TAXI' || type === 'DRIVER') {
    const now = new Date().toISOString();
    const images = form.imageUrl ? [form.imageUrl] : [];
    return {
      name: form.name.trim(),
      ...(type === 'TAXI' ? { operatorName: String(form.operatorName || '').trim() } : {}),
      gender: form.gender || undefined,
      fatherOrHusbandName: form.fatherOrHusbandName?.trim(),
      dateOfBirth: form.dateOfBirth || undefined,
      address: {
        line1: form.addressLine1,
        pincode: form.pincode,
      },
      contact: {
        primaryMobile: form.primaryMobile,
        alternateMobile: form.alternateMobile,
        whatsapp: form.whatsapp,
        email: form.email,
        emergencyName: form.emergencyContactName,
        emergencyMobile: form.emergencyContactMobile,
      },
      phone: form.primaryMobile,
      vehicleType: form.vehicleType || (type === 'TAXI' ? 'INNOVA' : 'SEDAN'),
      vehicleNumber: form.vehicleNumber,
      vehicle: {
        licenseNumber: form.drivingLicenseNumber,
        licenseType: form.licenseType || undefined,
      },
      serviceArea: form.serviceArea?.trim(),
      experience: num(form.experience, 1),
      perTripPrice: num(form.perTripPrice),
      hourlyRate: num(form.hourlyRate),
      photo: form.imageUrl || undefined,
      images,
      bankDetails: {
        bankName: form.bankName,
        branch: form.bankBranch,
        accountHolder: form.accountHolder,
        accountNumber: form.accountNumber,
        ifsc: form.ifsc,
      },
      ...(form.acceptTerms ? { acceptedTermsAt: now } : {}),
      ...(form.acceptAgreement ? { acceptedAgreementAt: now } : {}),
      ...(form.acceptDeclaration ? { declarationAcceptedAt: now } : {}),
    };
  }
  if (type === 'HORSE') {
    const routes = (form.routes || []).map((route) => ({
      name: String(route.name || '').trim(),
      durationMinutes: num(route.durationMinutes, 30),
      price: num(route.price),
    }));
    const priceFrom = routes.length ? Math.min(...routes.map((r) => r.price)) : 0;
    const now = new Date().toISOString();
    return {
      name: form.name.trim(),
      operatorName: String(form.operatorName || '').trim(),
      gender: form.gender || undefined,
      fatherOrHusbandName: String(form.fatherOrHusbandName || '').trim(),
      dateOfBirth: form.dateOfBirth || undefined,
      address: {
        line1: String(form.addressLine1 || '').trim(),
        pincode: String(form.pincode || '').trim(),
      },
      contact: {
        primaryMobile: String(form.primaryMobile || '').trim(),
        alternateMobile: String(form.alternateMobile || '').trim(),
        whatsapp: String(form.whatsapp || '').trim(),
        email: String(form.email || '').trim(),
        emergencyName: String(form.emergencyName || '').trim(),
        emergencyMobile: String(form.emergencyMobile || '').trim(),
      },
      contactPhone: String(form.primaryMobile || '').trim(),
      description: form.description,
      horseDetails: String(form.horseDetails || '').trim(),
      location: form.location || 'Mahabaleshwar',
      stable: {
        serviceArea: String(form.serviceArea || form.location || 'Mahabaleshwar').trim(),
        horseCount: num(form.horseCount, 1),
        safetyGearProvided: form.safetyGearProvided !== false,
        experience: num(form.experience, 1),
      },
      experience: num(form.experience, 1),
      availability: {
        slotsPerDay: num(form.slotsPerDay, 8),
      },
      isActive: form.isActive !== false,
      images,
      routes,
      priceFrom,
      bankDetails: {
        bankName: form.bankName,
        branch: form.bankBranch,
        accountHolder: form.accountHolder,
        accountNumber: form.accountNumber,
        ifsc: form.ifsc,
      },
      ...(form.acceptTerms ? { acceptedTermsAt: now } : {}),
      ...(form.acceptAgreement ? { acceptedAgreementAt: now } : {}),
      ...(form.acceptDeclaration ? { declarationAcceptedAt: now } : {}),
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
      if (!form.acceptDeclaration) return 'Please accept the declaration';
    }
    return null;
  }
  if (type === 'TENT' && num(form.pricePerNight) <= 0) return 'Nightly price must be greater than 0';
  if (type === 'GUIDE') {
    if (!String(form.gender || '').trim()) return 'Gender is required';
    if (!String(form.fatherOrHusbandName || '').trim()) return "Father's / Husband's name is required";
    if (!String(form.dateOfBirth || '').trim()) return 'Date of birth is required';
    if (!String(form.addressLine1 || '').trim()) return 'Permanent address is required';
    if (!String(form.pincode || '').trim()) return 'Pin code is required';
    if (!String(form.primaryMobile || '').trim()) return 'Primary mobile is required';
    if (!String(form.email || '').trim()) return 'Email is required';
    if (!String(form.mainTourismArea || '').trim()) return 'Main tourism area is required';
    const langs = Array.isArray(form.languages) ? form.languages : splitList(form.languages);
    if (!langs.length && !String(form.otherLanguages || '').trim()) return 'Select at least one language';
    if (num(form.package6hr) <= 0 || num(form.package12hr) <= 0) {
      return '6hr and 12hr package prices must be greater than 0';
    }
    if (!String(form.bankName || '').trim() || !String(form.accountNumber || '').trim() || !String(form.ifsc || '').trim()) {
      return 'Bank name, account number, and IFSC are required';
    }
    if (isCreate) {
      if (!form.acceptTerms) return 'Please accept the Terms and Conditions';
      if (!form.acceptDeclaration) return 'Please accept the declaration';
    }
    return null;
  }
  if (type === 'TAXI') {
    if (!String(form.operatorName || '').trim()) return 'Proprietor / owner name is required';
    if (!String(form.gender || '').trim()) return 'Gender is required';
    if (!String(form.fatherOrHusbandName || '').trim()) return "Father's / Husband's name is required";
    if (!String(form.dateOfBirth || '').trim()) return 'Date of birth is required';
    if (!String(form.addressLine1 || '').trim()) return 'Office address is required';
    if (!String(form.pincode || '').trim()) return 'Pin code is required';
    if (!String(form.primaryMobile || '').trim()) return 'Primary mobile is required';
    if (!String(form.email || '').trim()) return 'Email is required';
    if (!String(form.vehicleNumber || '').trim()) return 'Primary vehicle number is required';
    if (!String(form.drivingLicenseNumber || '').trim()) return 'Driving license number is required';
    if (!String(form.serviceArea || '').trim()) return 'Service area is required';
    if (num(form.perTripPrice) <= 0 && num(form.hourlyRate) <= 0) {
      return 'Enter a per-trip or hourly price greater than 0';
    }
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
  if (type === 'DRIVER') {
    if (!String(form.gender || '').trim()) return 'Gender is required';
    if (!String(form.fatherOrHusbandName || '').trim()) return "Father's / Husband's name is required";
    if (!String(form.dateOfBirth || '').trim()) return 'Date of birth is required';
    if (!String(form.addressLine1 || '').trim()) return 'Permanent address is required';
    if (!String(form.pincode || '').trim()) return 'Pin code is required';
    if (!String(form.primaryMobile || '').trim()) return 'Primary mobile is required';
    if (!String(form.email || '').trim()) return 'Email is required';
    if (!String(form.vehicleNumber || '').trim()) return 'Vehicle number is required';
    if (!String(form.drivingLicenseNumber || '').trim()) return 'Driving license number is required';
    if (!String(form.serviceArea || '').trim()) return 'Service area is required';
    if (num(form.perTripPrice) <= 0 && num(form.hourlyRate) <= 0) {
      return 'Enter a per-trip or hourly price greater than 0';
    }
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
  if (type === 'HORSE') {
    if (!String(form.operatorName || '').trim()) return 'Operator full name is required';
    if (!String(form.gender || '').trim()) return 'Gender is required';
    if (!String(form.fatherOrHusbandName || '').trim()) return "Father's / Husband's name is required";
    if (!String(form.dateOfBirth || '').trim()) return 'Date of birth is required';
    if (!String(form.addressLine1 || '').trim()) return 'Permanent address is required';
    if (!String(form.pincode || '').trim()) return 'Pin code is required';
    if (!String(form.primaryMobile || '').trim()) return 'Primary mobile is required';
    if (!String(form.email || '').trim()) return 'Email is required';
    if (!String(form.serviceArea || '').trim()) return 'Service area is required';
    if (num(form.horseCount) <= 0) return 'Number of horses must be at least 1';
    const routes = form.routes || [];
    if (!routes.length || routes.some((r) => !String(r.name || '').trim() || num(r.price) <= 0)) {
      return 'Each route needs a name and a price greater than 0';
    }
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
  if (type === 'PRODUCT' && num(form.price) <= 0) return 'Price must be greater than 0';
  return null;
};

export { defaultRoom, defaultRoute };
