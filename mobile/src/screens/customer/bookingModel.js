import { COLORS } from '../../constants/theme';
import { listingImage } from '../../utils/listing';

const TRIP_TENANTS = ['GUIDE', 'TAXI', 'DRIVER', 'HORSE'];
const TRIP_TYPES = ['GUIDE', 'TAXI', 'HORSE'];

export const OVERTIME_PER_HOUR = 150;

export const STATUS_TONE = {
    CONFIRMED: { bg: '#F0FDF4', fg: COLORS.success },
    PENDING: { bg: '#FFFBEB', fg: COLORS.warning },
    CANCELLED: { bg: '#FEF2F2', fg: '#B91C1C' },
    COMPLETED: { bg: COLORS.primarySoft, fg: COLORS.primary },
    REFUNDED: { bg: '#F1F5F9', fg: COLORS.muted },
};

export const isTrip = (b) =>
    (b.serviceTenant && TRIP_TENANTS.includes(b.serviceTenant)) || TRIP_TYPES.includes(b.type);
export const hasArrived = (b) => !!(b.vendorArrivedAt || b.guideReachedConfirmed || b.arrivalConfirmed);
export const arrivalOk = (b) => !!(b.arrivalConfirmed || b.guideReachedConfirmed);
export const ended = (b) => !!(b.serviceEndedAt || b.guideEndedAt || b.status === 'COMPLETED');
export const endProposed = (b) => !!(b.endProposedAt && !ended(b));
export const activeTrip = (b) =>
    isTrip(b) &&
    b.assignmentStatus === 'ASSIGNED' &&
    b.vendor &&
    !ended(b) &&
    b.status !== 'CANCELLED' &&
    b.status !== 'REFUNDED';

export function when(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function stayDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function bookingGroup(item) {
    if (item.status === 'CANCELLED' || item.status === 'REFUNDED') return 'cancelled';
    if (item.status === 'COMPLETED') return 'completed';
    return 'upcoming';
}

export function bookingListing(booking) {
    return booking?.hotel || booking?.homestay || booking?.tent || booking?.guide || booking?.driver || booking?.horse || null;
}

export function bookingImage(booking) {
    return listingImage(bookingListing(booking));
}
