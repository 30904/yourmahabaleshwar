import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import AppSeo from './components/seo/AppSeo';
import { ROLES } from './constants/roles';

import HomePage from './pages/public/HomePage';
import HotelsPage from './pages/public/HotelsPage';
import ResortsPage from './pages/public/ResortsPage';
import HomestaysPage from './pages/public/HomestaysPage';
import HomestayDetailPage from './pages/public/HomestayDetailPage';
import TentsPage from './pages/public/TentsPage';
import GuidesPage from './pages/public/GuidesPage';
import TaxiPage from './pages/public/TaxiPage';
import HorsesPage from './pages/public/HorsesPage';
import HorseDetailPage from './pages/public/HorseDetailPage';
import ProductsPage from './pages/public/ProductsPage';
import ProductDetailPage from './pages/public/ProductDetailPage';
import CombosPage from './pages/public/CombosPage';
import ComboDetailPage from './pages/public/ComboDetailPage';
import StaticPage from './pages/public/StaticPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VendorRegisterPage from './pages/auth/VendorRegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import HotelDetailPage from './pages/public/HotelDetailPage';
import TentDetailPage from './pages/public/TentDetailPage';
import GuideDetailPage from './pages/public/GuideDetailPage';
import TaxiDetailPage from './pages/public/TaxiDetailPage';
import EnquiryPage from './pages/public/EnquiryPage';
import SearchPage from './pages/public/SearchPage';
import ContactPage from './pages/public/ContactPage';
import FaqPage from './pages/public/FaqPage';
import BlogsPage from './pages/public/BlogsPage';

import CustomerOverview from './dashboards/customer/CustomerOverview';
import CustomerBookings from './dashboards/customer/CustomerBookings';
import CustomerProfile from './dashboards/customer/CustomerProfile';
import CustomerFavorites from './dashboards/customer/CustomerFavorites';

import VendorOverview from './dashboards/vendor/VendorOverview';
import VendorBookings from './dashboards/vendor/VendorBookings';
import VendorKYC from './dashboards/vendor/VendorKYC';
import VendorAvailability from './dashboards/vendor/VendorAvailability';
import VendorWallet from './dashboards/vendor/VendorWallet';

import AdminOverview from './dashboards/admin/AdminOverview';
import AdminBookings from './dashboards/admin/AdminBookings';
import AdminKYC from './dashboards/admin/AdminKYC';
import AdminCMS from './dashboards/admin/AdminCMS';
import AdminLayout from './admin/layouts/AdminLayout';
import AdminRoutes from './admin/routes/AdminRoutes';

import { LayoutDashboard, Calendar, User, FileText, Image, Heart, CalendarDays, Wallet } from 'lucide-react';

const customerNav = [
  { to: '/dashboard/customer', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/customer/bookings', label: 'My Bookings', icon: Calendar },
  { to: '/dashboard/customer/favorites', label: 'Favorites', icon: Heart },
  { to: '/dashboard/customer/profile', label: 'Profile', icon: User },
];

const vendorNav = [
  { to: '/dashboard/vendor', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/vendor/bookings', label: 'Bookings', icon: Calendar },
  { to: '/dashboard/vendor/availability', label: 'Availability', icon: CalendarDays },
  { to: '/dashboard/vendor/wallet', label: 'Wallet', icon: Wallet },
  { to: '/dashboard/vendor/kyc', label: 'KYC', icon: FileText },
];

const adminNav = [
  { to: '/dashboard/admin', label: 'Analytics', icon: LayoutDashboard },
  { to: '/dashboard/admin/bookings', label: 'Bookings', icon: Calendar },
  { to: '/dashboard/admin/kyc', label: 'KYC Approval', icon: FileText },
  { to: '/dashboard/admin/cms', label: 'CMS', icon: Image },
];

const vendorRoles = [
  ROLES.HOTEL_VENDOR,
  ROLES.HOMESTAY_VENDOR,
  ROLES.TENT_OPERATOR,
  ROLES.GUIDE,
  ROLES.DRIVER,
  ROLES.HORSE_OPERATOR,
  ROLES.PRODUCT_VENDOR,
];

export default function App() {
  return (
    <>
    <AppSeo />
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="hotels" element={<HotelsPage />} />
        <Route path="hotels/:slug" element={<HotelDetailPage />} />
        <Route path="resorts" element={<ResortsPage />} />
        <Route path="homestays" element={<HomestaysPage />} />
        <Route path="homestays/:slug" element={<HomestayDetailPage />} />
        <Route path="tents" element={<TentsPage />} />
        <Route path="tents/:slug" element={<TentDetailPage />} />
        <Route path="guides" element={<GuidesPage />} />
        <Route path="guides/:slug" element={<GuideDetailPage />} />
        <Route path="taxi" element={<TaxiPage />} />
        <Route path="taxi/:slug" element={<TaxiDetailPage />} />
        <Route path="horses" element={<HorsesPage />} />
        <Route path="horses/:slug" element={<HorseDetailPage />} />
        <Route path="strawberries" element={<ProductsPage vertical="STRAWBERRY" />} />
        <Route path="strawberries/:slug" element={<ProductDetailPage vertical="STRAWBERRY" />} />
        <Route path="mapro" element={<ProductsPage vertical="MAPRO" />} />
        <Route path="mapro/:slug" element={<ProductDetailPage vertical="MAPRO" />} />
        <Route path="combos" element={<CombosPage />} />
        <Route path="combos/:slug" element={<ComboDetailPage />} />
        <Route path="driver-enquiry" element={<EnquiryPage type="DRIVER" />} />
        <Route path="hourly-enquiry" element={<EnquiryPage type="HOURLY" />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="blogs" element={<BlogsPage />} />
        <Route path="about-mahabaleshwar" element={
          <StaticPage title="About Mahabaleshwar">
            <p>Mahabaleshwar is a scenic hill station in Maharashtra, famous for strawberries, viewpoints, and pleasant weather year-round.</p>
          </StaticPage>
        } />
        <Route path="privacy-policy" element={
          <StaticPage title="Privacy Policy"><p>We respect your privacy and protect personal data per applicable laws.</p></StaticPage>
        } />
        <Route path="terms" element={
          <StaticPage title="Terms & Conditions"><p>By using this platform you agree to our booking and payment terms.</p></StaticPage>
        } />
        <Route path="cancellation-policy" element={
          <StaticPage title="Cancellation Policy"><p>Cancellation charges vary by property and booking type. See booking summary for details.</p></StaticPage>
        } />
      </Route>

      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="register-vendor" element={<VendorRegisterPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />

      <Route path="dashboard/customer" element={
        <ProtectedRoute roles={[ROLES.CUSTOMER]}>
          <DashboardLayout navItems={customerNav} title="Customer Dashboard" />
        </ProtectedRoute>
      }>
        <Route index element={<CustomerOverview />} />
        <Route path="bookings" element={<CustomerBookings />} />
        <Route path="favorites" element={<CustomerFavorites />} />
        <Route path="profile" element={<CustomerProfile />} />
      </Route>

      <Route path="dashboard/vendor" element={
        <ProtectedRoute roles={vendorRoles}>
          <DashboardLayout navItems={vendorNav} title="Vendor Dashboard" />
        </ProtectedRoute>
      }>
        <Route index element={<VendorOverview />} />
        <Route path="bookings" element={<VendorBookings />} />
        <Route path="availability" element={<VendorAvailability />} />
        <Route path="wallet" element={<VendorWallet />} />
        <Route path="kyc" element={<VendorKYC />} />
      </Route>

      <Route path="dashboard/admin" element={
        <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.OFFICE_STAFF_HOTEL, ROLES.OFFICE_STAFF_GUIDE]}>
          <DashboardLayout navItems={adminNav} title="Admin Panel" />
        </ProtectedRoute>
      }>
        <Route index element={<AdminOverview />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="kyc" element={<AdminKYC />} />
        <Route path="cms" element={<AdminCMS />} />
      </Route>

      <Route
        path="admin/*"
        element={
          <ProtectedRoute
            roles={[
              ROLES.SUPER_ADMIN,
              ROLES.OFFICE_STAFF_HOTEL,
              ROLES.OFFICE_STAFF_GUIDE,
              ROLES.MARKETING_STAFF,
            ]}
          >
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="*" element={<AdminRoutes />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
