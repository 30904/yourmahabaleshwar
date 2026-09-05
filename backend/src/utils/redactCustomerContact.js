/**
 * Hide customer phone/mobile from service vendors until they accept the booking.
 * Applies to tent / guide / taxi / driver / horse open requests.
 */
export function redactCustomerContactForOpenBooking(booking) {
  if (!booking) return booking;
  const doc = booking.toObject ? booking.toObject() : { ...booking };

  if (doc.customer && typeof doc.customer === 'object') {
    const { phone, ...rest } = doc.customer;
    doc.customer = { ...rest, phone: undefined };
    delete doc.customer.phone;
  }

  if (doc.guestRegistration?.leadGuest) {
    const lead = { ...doc.guestRegistration.leadGuest };
    delete lead.mobile;
    delete lead.phone;
    doc.guestRegistration = {
      ...doc.guestRegistration,
      leadGuest: lead,
    };
  }

  return doc;
}

export function redactOpenBookingList(bookings) {
  return (bookings || []).map(redactCustomerContactForOpenBooking);
}
