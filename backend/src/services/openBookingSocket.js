import { getIo, tenantRoom } from '../socket/index.js';

function serializeOpenBooking(booking) {
  const doc = booking?.toObject ? booking.toObject() : booking;
  return {
    _id: String(doc._id),
    bookingNumber: doc.bookingNumber,
    serviceTenant: doc.serviceTenant,
    type: doc.type,
    status: doc.status,
    assignmentStatus: doc.assignmentStatus,
    checkIn: doc.checkIn,
    checkOut: doc.checkOut,
    subtotal: doc.subtotal,
    total: doc.total,
    guestRegistration: doc.guestRegistration,
    guidePackage: doc.guidePackage,
    bikeAddon: doc.bikeAddon,
    tentQuantity: doc.tentQuantity,
    guests: doc.guests,
    gst: doc.gst,
    horseRouteId: doc.horseRouteId,
    notes: doc.notes,
    createdAt: doc.createdAt,
    customer:
      doc.customer && typeof doc.customer === 'object'
        ? { name: doc.customer.name, phone: doc.customer.phone }
        : doc.customer,
  };
}

export function emitOpenBookingCreated(booking) {
  const io = getIo();
  if (!io || !booking?.serviceTenant) return;
  io.to(tenantRoom(booking.serviceTenant)).emit('booking:created', serializeOpenBooking(booking));
}

export function emitOpenBookingRemoved(booking) {
  const io = getIo();
  if (!io || !booking?.serviceTenant) return;
  io.to(tenantRoom(booking.serviceTenant)).emit('booking:accepted', {
    bookingId: String(booking._id),
    acceptedBy: booking.vendor ? String(booking.vendor) : null,
  });
}
