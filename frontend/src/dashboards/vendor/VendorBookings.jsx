import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SERVICE_SUBSCRIPTION_ROLES } from '../../dashboards/vendor/vendorNav';
import BookingsList from '../../components/booking/BookingsList';
import OpenBookingsPanel from '../../components/booking/OpenBookingsPanel';

export default function VendorBookings() {
  const { user } = useAuth();
  const [assignedRefreshKey, setAssignedRefreshKey] = useState(0);
  const showOpenBookings = SERVICE_SUBSCRIPTION_ROLES.includes(user?.role);

  return (
    <div>
      <h2 className="text-xl font-bold">Vendor Bookings</h2>
      <p className="mt-1 text-sm text-slate-500">Bookings for your listings</p>
      {showOpenBookings && (
        <div className="mt-6">
          <OpenBookingsPanel onAccepted={() => setAssignedRefreshKey((key) => key + 1)} />
        </div>
      )}
      <div className="mt-6">
        <BookingsList mode="vendor" allowStatusUpdate refreshKey={assignedRefreshKey} />
      </div>
    </div>
  );
}
