import { useRoutes, Navigate } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import PropertyListPage from '../pages/properties/PropertyListPage';
import PropertyFormPage from '../pages/properties/PropertyFormPage';
import AdminListingFormPage from '../pages/listings/AdminListingFormPage';
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
import StaffManagementPage from '../pages/system/StaffManagementPage';
import AdminSuperRoute from '../components/AdminSuperRoute';
import CmsHubPage from '../pages/cms/CmsHubPage';
import BlogsPage from '../pages/cms/BlogsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import ServiceMonetizationPage from '../pages/settings/ServiceMonetizationPage';
import UploadCenterPage from '../pages/upload/UploadCenterPage';
import KycPage from '../pages/kyc/KycPage';
import DeleteReviewsPage from '../pages/customers/DeleteReviewsPage';
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
  { path: 'properties/new', element: <Navigate to="/admin/listings/new?type=HOTEL" replace /> },
  { path: 'properties/edit/:id', element: <PropertyFormPage /> },
  { path: 'listings/new', element: <AdminListingFormPage /> },
  { path: 'listings/:vertical/:id/edit', element: <AdminListingFormPage /> },
  { path: 'properties/amenities', element: <AmenitiesPage /> },
  { path: 'properties/room-types', element: <RoomTypesPage /> },
  { path: 'guides', element: <GuideListPage /> },
  { path: 'guides/kyc-pending', element: <GuideListPage kycFilter="pending" /> },
  { path: 'guides/approved', element: <GuideListPage kycFilter="approved" /> },
  { path: 'guides/packages', element: <GuidePackagesPage /> },
  { path: 'taxi', element: <DriverListPage vendorType="TAXI" /> },
  { path: 'taxi/kyc-pending', element: <DriverListPage vendorType="TAXI" kycFilter="pending" /> },
  { path: 'taxi/approved', element: <DriverListPage vendorType="TAXI" kycFilter="approved" /> },
  { path: 'taxi/hourly', element: <TaxiHourlyPage /> },
  { path: 'drivers', element: <DriverListPage vendorType="DRIVER" /> },
  { path: 'drivers/kyc-pending', element: <DriverListPage vendorType="DRIVER" kycFilter="pending" /> },
  { path: 'drivers/approved', element: <DriverListPage vendorType="DRIVER" kycFilter="approved" /> },
  { path: 'bookings', element: <BookingListPage /> },
  { path: 'bookings/unassigned', element: <BookingListPage assignmentFilter="UNASSIGNED" /> },
  { path: 'bookings/guides', element: <BookingListPage serviceTenant="GUIDE" /> },
  { path: 'bookings/taxi', element: <BookingListPage serviceTenant="TAXI" /> },
  { path: 'bookings/drivers', element: <BookingListPage serviceTenant="DRIVER" /> },
  { path: 'bookings/tents', element: <BookingListPage serviceTenant="TENT" /> },
  { path: 'bookings/horses', element: <BookingListPage serviceTenant="HORSE" /> },
  { path: 'bookings/hotels', element: <BookingListPage type="HOTEL" /> },
  { path: 'bookings/homestays', element: <BookingListPage type="HOMESTAY" /> },
  { path: 'bookings/resorts', element: <BookingListPage type="RESORT" /> },
  { path: 'bookings/enquiries', element: <EnquiriesPage /> },
  { path: 'bookings/cancelled', element: <BookingListPage statusFilter="CANCELLED" /> },
  { path: 'pricing/coupons', element: <CouponsPage /> },
  { path: 'pricing/featured', element: <AdsPage /> },
  { path: 'pricing/seasonal', element: <DomainToolsPage /> },
  { path: 'ads', element: <AdsPage /> },
  { path: 'customers', element: <CustomerListPage /> },
  { path: 'customers/reviews', element: <Navigate to="/admin/customers/delete-reviews" replace /> },
  { path: 'customers/delete-reviews', element: <DeleteReviewsPage /> },
  { path: 'vendors', element: <VendorListPage /> },
  { path: 'vendors/payouts', element: <AdminSuperRoute finance><PayoutsPage /></AdminSuperRoute> },
  { path: 'finance', element: <AdminSuperRoute finance><FinancePage /></AdminSuperRoute> },
  { path: 'finance/commission', element: <AdminSuperRoute finance><FinancePage section="commission" /></AdminSuperRoute> },
  { path: 'finance/transactions', element: <AdminSuperRoute finance><FinancePage section="transactions" /></AdminSuperRoute> },
  { path: 'finance/gst', element: <AdminSuperRoute finance><ReportsHubPage focus="gst" /></AdminSuperRoute> },
  { path: 'finance/subscriptions', element: <AdminSuperRoute finance><SubscriptionsPage /></AdminSuperRoute> },
  { path: 'marketing', element: <CampaignsPage /> },
  { path: 'shop', element: <ProductsCombosAdminPage /> },
  { path: 'cms', element: <CmsHubPage /> },
  { path: 'cms/banners', element: <CmsHubPage tab="banners" /> },
  { path: 'cms/blogs', element: <BlogsPage /> },
  { path: 'cms/faqs', element: <CmsHubPage tab="faqs" /> },
  { path: 'cms/seo', element: <SettingsPage /> },
  { path: 'reports', element: <AdminSuperRoute finance><ReportsHubPage /></AdminSuperRoute> },
  { path: 'reports/revenue', element: <AdminSuperRoute finance><ReportsHubPage focus="revenue" /></AdminSuperRoute> },
  { path: 'reports/destinations', element: <DomainToolsPage /> },
  { path: 'kyc', element: <KycPage /> },
  { path: 'settings', element: <AdminSuperRoute><SettingsPage /></AdminSuperRoute> },
  { path: 'settings/service-monetization', element: <AdminSuperRoute><ServiceMonetizationPage /></AdminSuperRoute> },
  { path: 'upload-center', element: <AdminSuperRoute><UploadCenterPage /></AdminSuperRoute> },
  { path: 'backups', element: <AdminSuperRoute><BackupsPage /></AdminSuperRoute> },
  { path: 'domain-tools', element: <AdminSuperRoute><DomainToolsPage /></AdminSuperRoute> },
  { path: 'staff', element: <AdminSuperRoute><StaffManagementPage /></AdminSuperRoute> },
  { path: 'notifications', element: <CampaignsPage /> },
  { path: '*', element: <Navigate to="/admin" replace /> },
];

export default function AdminRoutes() {
  return useRoutes(adminRouteConfig);
}
