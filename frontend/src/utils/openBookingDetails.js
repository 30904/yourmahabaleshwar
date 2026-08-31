import { taxiRouteById } from '../constants/taxiClientRateChart';
import { driverPackageById } from '../constants/driverClientRateChart';
import { horsePackageById } from '../constants/horseClientRateChart';

function detailRow(label, value) {
  const text = value == null || value === '' ? null : String(value).trim();
  if (!text) return null;
  return { label, value: text };
}

function formatTime(value) {
  if (!value) return null;
  return value;
}

export function buildOpenBookingDetailRows(booking, t) {
  const reg = booking.guestRegistration || {};
  const lead = reg.leadGuest || {};
  const rows = [];

  const push = (labelKey, value) => {
    const row = detailRow(t(labelKey), value);
    if (row) rows.push(row);
  };

  push('openBookings.details.email', lead.email || booking.customer?.email);
  push('openBookings.details.address', lead.address);
  push('openBookings.details.cityState', lead.cityState);

  if (booking.serviceTenant === 'TAXI' || booking.serviceTenant === 'DRIVER') {
    const taxi = reg.taxiDetails || {};
    if (booking.serviceTenant === 'TAXI') {
      const route =
        taxi.routeName ||
        (taxi.routeId ? t(taxiRouteById(taxi.routeId)?.nameKey || '') : '') ||
        booking.routeId;
      push('openBookings.details.route', route);
    } else {
      const pkg = taxi.packageId ? driverPackageById(taxi.packageId) : null;
      push('openBookings.details.package', pkg ? t(pkg.nameKey) : taxi.packageId);
    }
    push('openBookings.details.pickupTime', formatTime(taxi.startTime || reg.checkInTime));
    push('openBookings.details.pickup', taxi.pickupLocation || lead.comingFrom);
    push('openBookings.details.drop', taxi.dropLocation || lead.goingTo);
    push(
      'openBookings.details.passengers',
      taxi.passengerCount ?? booking.guests?.adults ?? reg.adults
    );
    if (taxi.preferredDestinations?.length) {
      push('openBookings.details.destinations', taxi.preferredDestinations.join(', '));
    }
    push('openBookings.details.vehicle', reg.taxiDetails?.vehiclePreference);
    push('openBookings.details.specialRequests', taxi.specialRequests);
  }

  if (booking.serviceTenant === 'GUIDE') {
    const tour = reg.tourDetails || {};
    push('openBookings.details.package', tour.packageType || booking.guidePackage);
    push('openBookings.details.pickupTime', formatTime(tour.startTime || reg.checkInTime));
    push('openBookings.details.tourists', tour.touristCount ?? booking.guests?.adults);
    push('openBookings.details.pickup', tour.pickupLocation);
    if (tour.bikeAddon || booking.bikeAddon) push('openBookings.details.bikeAddon', t('openBookings.details.yes'));
    if (tour.preferredSpots?.length) {
      push('openBookings.details.destinations', tour.preferredSpots.join(', '));
    }
    push('openBookings.details.specialRequests', tour.specialRequests);
  }

  if (booking.serviceTenant === 'HORSE') {
    const horse = reg.horseDetails || {};
    push(
      'openBookings.details.route',
      horse.routeName ||
        (horse.routeId ? t(horsePackageById(horse.routeId)?.nameKey || '') : '') ||
        booking.horseRouteId
    );
    push('openBookings.details.pickupTime', formatTime(horse.startTime || reg.checkInTime));
    push('openBookings.details.riders', horse.riderCount ?? booking.guests?.adults);
    push('openBookings.details.meetingPoint', horse.meetingPoint);
    push('openBookings.details.specialRequests', horse.specialRequests);
  }

  if (booking.serviceTenant === 'TENT') {
    push('openBookings.details.tents', booking.tentQuantity);
    push('openBookings.details.guests', booking.guests?.adults);
    push('openBookings.details.specialRequests', reg.specialRequests || reg.notes);
  }

  const coTravellers = (reg.coTravellers || []).filter((m) => m?.fullName?.trim());
  if (coTravellers.length) {
    push(
      'openBookings.details.coTravellers',
      coTravellers.map((m) => m.fullName).join(', ')
    );
  }

  push('openBookings.details.paymentMode', reg.paymentMode);

  return rows;
}
