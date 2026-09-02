import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getVendorNav, vendorCanAccessPath, vendorDashboardTitleKey } from './vendorNav';

export default function VendorShell() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (!vendorCanAccessPath(user?.role, location.pathname)) {
    return <Navigate to="/dashboard/vendor" replace />;
  }

  return (
    <DashboardLayout
      navItems={getVendorNav(user?.role, t)}
      title={t(vendorDashboardTitleKey(user?.role))}
    />
  );
}
