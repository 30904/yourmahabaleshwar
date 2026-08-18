import {
  Building2,
  Calendar,
  CalendarDays,
  Car,
  FileText,
  Home,
  Languages,
  LayoutDashboard,
  ShoppingBag,
  Star,
  Tent,
  Tag,
  Trees,
  Wallet,
} from 'lucide-react';
import { ROLES } from '../../constants/roles';

export const AVAILABILITY_ROLES = [
  ROLES.HOTEL_VENDOR,
  ROLES.HOMESTAY_VENDOR,
  ROLES.TENT_OPERATOR,
  ROLES.HORSE_OPERATOR,
];

const LISTINGS_NAV = {
  [ROLES.HOTEL_VENDOR]: { labelKey: 'vendor.navHotels', icon: Building2 },
  [ROLES.HOMESTAY_VENDOR]: { labelKey: 'vendor.navHomestays', icon: Home },
  [ROLES.TENT_OPERATOR]: { labelKey: 'vendor.navTents', icon: Tent },
  [ROLES.GUIDE]: { labelKey: 'vendor.navGuides', icon: Languages },
  [ROLES.DRIVER]: { labelKey: 'vendor.navTaxi', icon: Car },
  [ROLES.HORSE_OPERATOR]: { labelKey: 'vendor.navHorses', icon: Trees },
  [ROLES.PRODUCT_VENDOR]: { labelKey: 'vendor.navProducts', icon: ShoppingBag },
};

const TITLE_KEYS = {
  [ROLES.HOTEL_VENDOR]: 'vendor.dashHotel',
  [ROLES.HOMESTAY_VENDOR]: 'vendor.dashHomestay',
  [ROLES.TENT_OPERATOR]: 'vendor.dashTent',
  [ROLES.GUIDE]: 'vendor.dashGuide',
  [ROLES.DRIVER]: 'vendor.dashTaxi',
  [ROLES.HORSE_OPERATOR]: 'vendor.dashHorse',
  [ROLES.PRODUCT_VENDOR]: 'vendor.dashProduct',
};

const AVAILABILITY_TYPES = {
  [ROLES.HOTEL_VENDOR]: [{ value: 'room', label: 'Hotel room' }],
  [ROLES.HOMESTAY_VENDOR]: [{ value: 'homestay', label: 'Homestay' }],
  [ROLES.TENT_OPERATOR]: [{ value: 'tent', label: 'Tent' }],
  [ROLES.HORSE_OPERATOR]: [{ value: 'horse', label: 'Horse' }],
};

export function vendorDashboardTitleKey(role) {
  return TITLE_KEYS[role] || 'vendor.overview';
}

export function roleHasAvailability(role) {
  return AVAILABILITY_ROLES.includes(role);
}

export function vendorCanAccessPath(role, pathname) {
  if (String(pathname || '').startsWith('/dashboard/vendor/availability')) {
    return roleHasAvailability(role);
  }
  return true;
}

export function availabilityTypesForRole(role) {
  return AVAILABILITY_TYPES[role] || [];
}

export function getVendorNav(role, t) {
  const listings = LISTINGS_NAV[role] || { labelKey: 'vendor.listings', icon: Building2 };
  const items = [
    { to: '/dashboard/vendor', label: t('vendor.navOverview'), icon: LayoutDashboard, end: true },
    { to: '/dashboard/vendor/listings', label: t(listings.labelKey), icon: listings.icon },
    { to: '/dashboard/vendor/pricing', label: t('vendor.pricing'), icon: Tag },
    { to: '/dashboard/vendor/bookings', label: t('vendor.bookings'), icon: Calendar },
  ];
  if (roleHasAvailability(role)) {
    items.push({
      to: '/dashboard/vendor/availability',
      label: t('vendor.availability'),
      icon: CalendarDays,
    });
  }
  items.push(
    { to: '/dashboard/vendor/reviews', label: t('vendor.reviews'), icon: Star },
    { to: '/dashboard/vendor/wallet', label: t('vendor.wallet'), icon: Wallet },
    { to: '/dashboard/vendor/kyc', label: t('vendor.navKyc'), icon: FileText },
  );
  return items;
}
