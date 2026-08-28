import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

const breadcrumbMap = {
  '/admin': ['Admin', 'Dashboard'],
  '/admin/properties': ['Admin', 'Properties'],
  '/admin/listings/new': ['Admin', 'Listings', 'Add Listing'],
  '/admin/bookings': ['Admin', 'Bookings'],
  '/admin/guides': ['Admin', 'Guides'],
  '/admin/taxi': ['Admin', 'Taxi'],
  '/admin/drivers': ['Admin', 'Drivers'],
  '/admin/finance': ['Admin', 'Finance'],
  '/admin/cms': ['Admin', 'CMS'],
  '/admin/settings': ['Admin', 'Settings'],
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const breadcrumbs = breadcrumbMap[location.pathname] || ['Admin', location.pathname.split('/').pop()];

  return (
    <div className={`admin-shell theme-scrollbar ${collapsed ? 'admin-shell-collapsed' : ''}`}>
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="admin-main">
        <AdminHeader onMenuClick={() => setMobileOpen(true)} breadcrumbs={breadcrumbs} />
        <main className="admin-content theme-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}