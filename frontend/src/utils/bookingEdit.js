export function dateInputValue(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function canCustomerEditBooking(booking) {
  if (!booking) return false;
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) return false;
  if (
    booking.vendorArrivedAt ||
    booking.arrivalConfirmed ||
    booking.endProposedAt ||
    booking.serviceEndedAt ||
    booking.guideReachedAt ||
    booking.guideEndedAt
  ) {
    return false;
  }
  const type = booking.serviceTenant || booking.type;
  return ['HOTEL', 'RESORT', 'HOMESTAY', 'TENT', 'GUIDE', 'TAXI', 'DRIVER', 'HORSE'].includes(type);
}

function readEmergency(notes) {
  const line = String(notes || '')
    .split('\n')
    .find((row) => row.startsWith('Emergency:'));
  if (!line) return { emergencyName: '', emergencyMobile: '' };
  const [name, mobile] = line.slice('Emergency:'.length).trim().split(' · ');
  return { emergencyName: (name || '').trim(), emergencyMobile: (mobile || '').trim() };
}

function notesWithoutEmergency(text, dropIncludes = []) {
  return String(text || '')
    .split('\n')
    .filter((line) => {
      if (!line || line.startsWith('Emergency:')) return false;
      return !dropIncludes.some((bit) => bit && line.includes(bit));
    })
    .join('\n');
}

function leadPatch(lead) {
  return {
    leadFullName: lead.fullName || '',
    leadAge: lead.age != null && lead.age !== '' ? String(lead.age) : '',
    leadGender: lead.gender || '',
    leadMobile: lead.mobile || '',
    leadEmail: lead.email || '',
    leadAddress: lead.address || '',
    leadCityState: lead.cityState || '',
    leadPincode: lead.pincode || '',
  };
}

function money(reg) {
  return {
    paymentMode: reg.paymentMode || 'ONLINE',
    advanceAmount: reg.advanceAmount != null && reg.advanceAmount !== '' ? String(reg.advanceAmount) : '',
    acceptTerms: true,
  };
}

export function prefillBookingForm(base, booking, kind) {
  if (!booking) return base;
  const reg = booking.guestRegistration || {};
  const lead = reg.leadGuest || {};
  const tour = reg.tourDetails || {};
  const taxi = reg.taxiDetails || {};
  const horse = reg.horseDetails || {};

  if (kind === 'stay' || kind === 'tent') {
    const paymentMode =
      kind === 'tent' || reg.paymentMode !== 'CASH' ? reg.paymentMode || 'ONLINE' : 'ONLINE';
    return {
      ...base,
      checkIn: dateInputValue(booking.checkIn),
      checkOut: dateInputValue(booking.checkOut),
      checkInTime: reg.checkInTime || base.checkInTime,
      checkOutTime: reg.checkOutTime || base.checkOutTime,
      roomId: booking.room?._id || booking.room || booking.homestayRoomId || base.roomId,
      tentQuantity: booking.tentQuantity || base.tentQuantity || 1,
      adults: booking.guests?.adults ?? base.adults,
      children: booking.guests?.children ?? base.children,
      ...leadPatch(lead),
      comingFrom: lead.comingFrom || '',
      goingTo: lead.goingTo || '',
      purpose: lead.purpose || base.purpose || 'TOURISM',
      idType: reg.idProof?.type || base.idType || 'AADHAAR',
      idNumber: reg.idProof?.number || '',
      idProofDocumentUrl: reg.idProof?.documentUrl || '',
      nationality: reg.idProof?.nationality || 'INDIAN',
      specialRequests: reg.notes || '',
      coTravellers: Array.isArray(reg.coTravellers) ? reg.coTravellers : [],
      paymentMode,
      advanceAmount: money(reg).advanceAmount,
      acceptTerms: true,
    };
  }

  if (kind === 'guide') {
    return {
      ...base,
      tourDate: dateInputValue(booking.checkIn),
      startTime: tour.startTime || reg.checkInTime || base.startTime,
      guidePackage: tour.packageType || booking.guidePackage || base.guidePackage,
      selectedTourId: tour.tourLocationId || base.selectedTourId,
      bikeAddon: tour.bikeAddon || booking.bikeAddon ? 'yes' : 'no',
      ...leadPatch(lead),
      ...readEmergency(tour.specialRequests),
      pickupLocation: tour.pickupLocation || '',
      preferredSpots: Array.isArray(tour.preferredSpots) ? tour.preferredSpots : [],
      specialRequests: notesWithoutEmergency(tour.specialRequests),
      groupMembers: Array.isArray(reg.coTravellers) ? reg.coTravellers : [],
      ...money(reg),
    };
  }

  if (kind === 'taxi' || kind === 'driver') {
    return {
      ...base,
      tripDate: dateInputValue(booking.checkIn),
      pickupTime: taxi.startTime || reg.checkInTime || base.pickupTime,
      taxiType: taxi.tripType === 'HOURLY' ? 'HOURLY' : base.taxiType || 'PER_TRIP',
      selectedRouteId: taxi.routeId || base.selectedRouteId,
      selectedPackageId: taxi.packageId || base.selectedPackageId,
      carType: taxi.carType || base.carType,
      hours: taxi.hours || base.hours,
      passengerCount: taxi.passengerCount || booking.guests?.adults || base.passengerCount,
      ...leadPatch(lead),
      ...readEmergency(taxi.specialRequests),
      pickupLocation: taxi.pickupLocation || '',
      dropLocation: taxi.dropLocation || '',
      routeTripType: taxi.routeTripType || base.routeTripType || 'ROUND_TRIP',
      specialRequests: notesWithoutEmergency(taxi.specialRequests, [taxi.carTypeLabel].filter(Boolean)),
      ...money(reg),
    };
  }

  if (kind === 'horse') {
    return {
      ...base,
      rideDate: dateInputValue(booking.checkIn),
      startTime: horse.startTime || reg.checkInTime || base.startTime,
      routeId: horse.routeId || booking.horseRouteId || base.routeId,
      riderCount: horse.riderCount || booking.guests?.adults || base.riderCount,
      ...leadPatch(lead),
      ...readEmergency(horse.specialRequests),
      specialRequests: notesWithoutEmergency(horse.specialRequests),
      groupMembers: Array.isArray(reg.coTravellers) ? reg.coTravellers : [],
      acceptSafety: true,
      ...money(reg),
    };
  }

  return base;
}
