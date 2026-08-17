import { useRoutes, Navigate } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import PropertyListPage from '../pages/properties/PropertyListPage';
import PropertyFormPage from '../pages/properties/PropertyFormPage';
import AmenitiesPage from '../pages/properties/AmenitiesPage';
import RoomTypesPage from '../pages/properties/RoomTypesPage';
import BookingListPage from '../pages/bookings/BookingListPage';
import GuideListPage from '../pages/guides/GuideListPage';
import DriverListPage from '../pages/taxi/DriverListPage';
import CouponsPage from '../pages/pricing/CouponsPage';
import CustomerListPage from '../pages/customers/CustomerListPage';
import VendorListPage from '../pages/vendors/VendorListPage';
import FinancePage from '../pages/finance/FinancePage';
import SubscriptionsPage from '../pages/finance/SubscriptionsPage';
import PayoutsPage from '../pages/finance/PayoutsPage';
import AdsPage from '../pages/ads/AdsPage';
import CampaignsPage from '../pages/marketing/CampaignsPage';
import ReportsHubPage from '../pages/reports/ReportsHubPage';
import BackupsPage from '../pages/system/BackupsPage';
import DomainToolsPage from '../pages/system/DomainToolsPage';
import OfficeStaffPage from '../pages/system/OfficeStaffPage';
import CmsHubPage from '../pages/cms/CmsHubPage';
import BlogsPage from '../pages/cms/BlogsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import UploadCenterPage from '../pages/upload/UploadCenterPage';
import KycPage from '../pages/kyc/KycPage';
import ReviewsModerationPage from '../pages/ReviewsModerationPage';
import GuidePackagesPage from '../pages/guides/GuidePackagesPage';
import TaxiHourlyPage from '../pages/taxi/TaxiHourlyPage';
import EnquiriesPage from '../pages/bookings/EnquiriesPage';
import HomestayHorseListPage from '../pages/properties/HomestayHorseListPage';
import ProductsCombosAdminPage from '../pages/shop/ProductsCombosAdminPage';

const adminRouteConfig = [
  { index: true, element: <DashboardPage /> },
  { path: 'properties', element: <PropertyListPage /> },
  { path: 'properties/hotels', element: <PropertyListPage typeFilter="hotels" /> },
  { path: 'properties/resorts', element: <PropertyListPage typeFilter="resorts" /> },
  { path: 'properties/homestays', element: <HomestayHorseListPage kind="homestays" /> },
  { path: 'properties/horses', element: <HomestayHorseListPage kind="horses" /> },
  { path: 'properties/tents', element: <PropertyListPage typeFilter="tents" /> },
  { path: 'properties/new', element: <PropertyFormPage /> },
  { path: 'properties/edit/:id', element: <PropertyFormPage /> },
  { path: 'properties/amenities', element: <AmenitiesPage /> },
  { path: 'properties/room-types', element: <RoomTypesPage /> },
  { path: 'guides', element: <GuideListPage /> },
  { path: 'guides/kyc-pending', element: <GuideListPage kycFilter="pending" /> },
  { path: 'guides/approved', element: <GuideListPage kycFilter="approved" /> },
  { path: 'guides/packages', element: <GuidePackagesPage /> },
  { path: 'taxi', element: <DriverListPage /> },
  { path: 'taxi/kyc-pending', element: <KycPage /> },
  { path: 'taxi/hourly', element: <TaxiHourlyPage /> },
  { path: 'bookings', element: <BookingListPage /> },
  { path: 'bookings/hotels', element: <BookingListPage type="HOTEL" /> },
  { path: 'bookings/tents', element: <BookingListPage type="TENT" /> },
  { path: 'bookings/guides', element: <BookingListPage type="GUIDE" /> },
  { path: 'bookings/taxi', element: <BookingListPage type="TAXI" /> },
  { path: 'bookings/enquiries', element: <EnquiriesPage /> },
  { path: 'bookings/cancelled', element: <BookingListPage statusFilter="CANCELLED" /> },
  { path: 'pricing/coupons', element: <CouponsPage /> },
  { path: 'pricing/featured', element: <AdsPage /> },
  { path: 'pricing/seasonal', element: <DomainToolsPage /> },
  { path: 'ads', element: <AdsPage /> },
  { path: 'customers', element: <CustomerListPage /> },
  { path: 'customers/reviews', element: <ReviewsModerationPage /> },
  { path: 'vendors', element: <VendorListPage /> },
  { path: 'vendors/payouts', element: <PayoutsPage /> },
  { path: 'finance', element: <FinancePage /> },
  { path: 'finance/commission', element: <FinancePage section="commission" /> },
  { path: 'finance/transactions', element: <FinancePage section="transactions" /> },
  { path: 'finance/gst', element: <ReportsHubPage focus="gst" /> },
  { path: 'finance/subscriptions', element: <SubscriptionsPage /> },
  { path: 'marketing', element: <CampaignsPage /> },
  { path: 'shop', element: <ProductsCombosAdminPage /> },
  { path: 'cms', element: <CmsHubPage /> },
  { path: 'cms/banners', element: <CmsHubPage tab="banners" /> },
  { path: 'cms/blogs', element: <BlogsPage /> },
  { path: 'cms/faqs', element: <CmsHubPage tab="faqs" /> },
  { path: 'cms/seo', element: <SettingsPage /> },
  { path: 'reports', element: <ReportsHubPage /> },
  { path: 'reports/revenue', element: <ReportsHubPage focus="revenue" /> },
  { path: 'reports/destinations', element: <DomainToolsPage /> },
  { path: 'kyc', element: <KycPage /> },
  { path: 'settings', element: <SettingsPage /> },
  { path: 'upload-center', element: <UploadCenterPage /> },
  { path: 'backups', element: <BackupsPage /> },
  { path: 'domain-tools', element: <DomainToolsPage /> },
  { path: 'staff', element: <OfficeStaffPage /> },
  { path: 'notifications', element: <CampaignsPage /> },
  { path: '*', element: <Navigate to="/admin" replace /> },
];

export default function AdminRoutes() {
  return useRoutes(adminRouteConfig);
}
