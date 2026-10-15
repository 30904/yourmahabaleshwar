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
