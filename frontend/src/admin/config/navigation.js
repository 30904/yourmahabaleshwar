import {
  LayoutDashboard,
  Building2,
  Tent,
  PlusCircle,
  Tags,
  Sparkles,
  BedDouble,
  Users,
  UserCheck,
  Clock,
  Package,
  Car,
  Calendar,
  XCircle,
  Percent,
  Ticket,
  Star,
  UserCircle,
  MessageSquare,
  Heart,
  Headphones,
  Store,
  Wallet,
  Receipt,
  CreditCard,
  Image,
  FileText,
  HelpCircle,
  Globe,
  Bell,
  Mail,
  BarChart3,
  TrendingUp,
  MapPin,
  Settings,
  Shield,
  UserCog,
  Upload,
  LogOut,
  HardDrive,
  Megaphone,
  Trees,
  ShoppingBag,
} from 'lucide-react';
import { HOMESTAY_VILLA } from '../../constants/homestayVillaLabels';
import { canManageStaff, canSeeFinance } from '../../utils/adminAccess';

/** @typedef {{ to: string, label: string, icon: import('lucide-react').LucideIcon, end?: boolean, superAdminOnly?: boolean, finance?: boolean }} NavItem */

export const adminNavGroups = [
  {
    id: 'main',
    items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    id: 'properties',
    label: 'Property Management',
    items: [
      { to: '/admin/properties', label: 'All Properties', icon: Building2 },
      { to: '/admin/properties/hotels', label: 'Hotels', icon: Building2 },
      { to: '/admin/properties/resorts', label: 'Resorts', icon: Building2 },
      { to: '/admin/properties/homestays', label: HOMESTAY_VILLA.plural, icon: BedDouble },
      { to: '/admin/properties/horses', label: 'Horse rides', icon: Trees },
      { to: '/admin/properties/tents', label: 'Tents', icon: Tent },
      { to: '/admin/listings/new?type=HOTEL', label: 'Add Listing', icon: PlusCircle },
      { to: '/admin/properties/amenities', label: 'Amenities', icon: Sparkles },
      { to: '/admin/properties/room-types', label: 'Room Types', icon: BedDouble },
    ],
  },
  {
    id: 'guides',
    label: 'Guide Management',
    items: [
      { to: '/admin/guides', label: 'All Guides', icon: Users },
      { to: '/admin/guides/kyc-pending', label: 'Pending KYC', icon: Clock },
      { to: '/admin/guides/approved', label: 'Approved Guides', icon: UserCheck },
      { to: '/admin/guides/packages', label: 'Guide Packages', icon: Package },
    ],
  },
  {
    id: 'taxi',
    label: 'Taxi Management',
    items: [
      { to: '/admin/taxi', label: 'All Taxi Listings', icon: Car },
      { to: '/admin/taxi/kyc-pending', label: 'Pending KYC', icon: Clock },
      { to: '/admin/taxi/approved', label: 'Approved Taxi', icon: UserCheck },
      { to: '/admin/taxi/hourly', label: 'Hourly Services', icon: Clock },
    ],
  },
  {
    id: 'drivers',
    label: 'Driver Management',
    items: [
      { to: '/admin/drivers', label: 'All Drivers', icon: Car },
      { to: '/admin/drivers/kyc-pending', label: 'Pending KYC', icon: Clock },
      { to: '/admin/drivers/approved', label: 'Approved Drivers', icon: UserCheck },
    ],
  },
  {
    id: 'bookings',
    label: 'Booking Management',
    items: [
      { to: '/admin/bookings', label: 'All Bookings', icon: Calendar },
      { to: '/admin/bookings/unassigned', label: 'Needs vendor assignment', icon: UserCheck },
      { to: '/admin/bookings/guides', label: 'Guide Bookings', icon: Users },
      { to: '/admin/bookings/taxi', label: 'Taxi Bookings', icon: Car },
      { to: '/admin/bookings/drivers', label: 'Driver Bookings', icon: Car },
      { to: '/admin/bookings/tents', label: 'Tent Bookings', icon: Tent },
      { to: '/admin/bookings/horses', label: 'Horse Bookings', icon: Trees },
      { to: '/admin/bookings/hotels', label: 'Hotel Bookings', icon: Building2 },
      { to: '/admin/bookings/homestays', label: HOMESTAY_VILLA.bookings, icon: BedDouble },
      { to: '/admin/bookings/resorts', label: 'Resort Bookings', icon: Building2 },
      { to: '/admin/bookings/enquiries', label: 'Enquiries', icon: MessageSquare },
      { to: '/admin/bookings/cancelled', label: 'Cancelled', icon: XCircle },
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing & Promotions',
    items: [
      { to: '/admin/pricing/coupons', label: 'Coupons & Offers', icon: Ticket },
      { to: '/admin/ads', label: 'Advertisements', icon: Star },
      { to: '/admin/pricing/featured', label: 'Featured Listings', icon: Star },
      { to: '/admin/pricing/seasonal', label: 'Seasonal Pricing', icon: Percent },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      { to: '/admin/marketing', label: 'Campaigns', icon: Megaphone },
      { to: '/admin/shop', label: 'Products & Combos', icon: ShoppingBag },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    items: [
      { to: '/admin/customers', label: 'All Customers', icon: UserCircle },
      { to: '/admin/customers/delete-reviews', label: 'Reviews', icon: MessageSquare, end: true },
    ],
  },
  {
    id: 'vendors',
    label: 'Vendors',
    items: [
      { to: '/admin/vendors', label: 'All Vendors', icon: Store },
      { to: '/admin/vendors/payouts', label: 'Payout Requests', icon: Wallet, finance: true },
      { to: '/admin/finance/subscriptions', label: 'Subscriptions', icon: CreditCard, finance: true },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    finance: true,
    items: [
      { to: '/admin/finance', label: 'Overview', icon: BarChart3, finance: true },
      { to: '/admin/finance/commission', label: 'Commission', icon: Percent, finance: true },
      { to: '/admin/finance/transactions', label: 'Transactions', icon: CreditCard, finance: true },
      { to: '/admin/finance/gst', label: 'GST Reports', icon: Receipt, finance: true },
      { to: '/admin/finance/subscriptions', label: 'Subscriptions & Points', icon: Heart, finance: true },
    ],
  },
  {
    id: 'cms',
    label: 'CMS Management',
    items: [
      { to: '/admin/cms', label: 'CMS Hub', icon: Image },
      { to: '/admin/cms/banners', label: 'Banners', icon: Image },
      { to: '/admin/cms/blogs', label: 'Blogs', icon: FileText },
      { to: '/admin/cms/faqs', label: 'FAQs', icon: HelpCircle },
      { to: '/admin/cms/seo', label: 'SEO Settings', icon: Globe },
    ],
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    finance: true,
    items: [
      { to: '/admin/reports', label: 'Reports Hub', icon: TrendingUp, finance: true },
      { to: '/admin/reports/revenue', label: 'Revenue', icon: BarChart3, finance: true },
      { to: '/admin/reports/destinations', label: 'Destinations', icon: MapPin },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { to: '/admin/kyc', label: 'KYC Approvals', icon: Shield },
      { to: '/admin/settings', label: 'Platform Settings', icon: Settings, superAdminOnly: true },
      { to: '/admin/settings/service-monetization', label: 'Service subscriptions', icon: CreditCard, superAdminOnly: true },
      { to: '/admin/upload-center', label: 'Upload Center', icon: Upload, superAdminOnly: true },
      { to: '/admin/backups', label: 'Backups', icon: HardDrive, superAdminOnly: true },
      { to: '/admin/domain-tools', label: 'Domain Tools', icon: Tags, superAdminOnly: true },
      { to: '/admin/staff', label: 'Staff', icon: UserCog, superAdminOnly: true },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
];

export const adminFooterItems = [{ to: '/login', label: 'Logout', icon: LogOut, action: 'logout' }];

export function getAdminNavForRole(role) {
  const showFinance = canSeeFinance(role);
  const showSuperAdmin = canManageStaff(role);

  return adminNavGroups
    .filter((group) => {
      if (group.finance && !showFinance) return false;
      return true;
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.finance && !showFinance) return false;
        if (item.superAdminOnly && !showSuperAdmin) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}
