import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import AssignVendorModal from '../../components/AssignVendorModal';
import useAdminAccess from '../../../hooks/useAdminAccess';
import { fetchAdminBookings, updateBookingStatus } from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';
import { bookingTitle } from '../../../utils/listingHelpers';
import { getMediaUrl } from '../../../utils/mediaUrl';
import { HOMESTAY_VILLA } from '../../../constants/homestayVillaLabels';

const TITLE_BY_TENANT = {
  GUIDE: 'Guide Bookings',
  TAXI: 'Taxi Bookings',
  DRIVER: 'Driver Bookings',
  TENT: 'Tent Bookings',
  HORSE: 'Horse Bookings',
};

const TITLE_BY_TYPE = {
  HOTEL: 'Hotel Bookings',
  RESORT: 'Resort Bookings',
  HOMESTAY: HOMESTAY_VILLA.bookings,
  TENT: 'Tent Bookings',
  GUIDE: 'Guide Bookings',
  TAXI: 'Taxi Bookings',
  HORSE: 'Horse Bookings',
};

function pageTitle({ type, serviceTenant, statusFilter, assignmentFilter }) {
  if (assignmentFilter === 'UNASSIGNED') return 'Needs vendor assignment';
  if (statusFilter === 'CANCELLED') return 'Cancelled Bookings';
  if (serviceTenant && TITLE_BY_TENANT[serviceTenant]) return TITLE_BY_TENANT[serviceTenant];
  if (type && TITLE_BY_TYPE[type]) return TITLE_BY_TYPE[type];
  return 'All Bookings';
}

function confirmBookingErrorMessage(error) {
  const message = error.response?.data?.message || '';
  const lower = message.toLowerCase();
  if (
    error.response?.status === 403 &&
    (lower.includes('point') || lower.includes('recharge') || lower.includes('insufficient'))
  ) {
    return 'Not enough points — assigned vendor must recharge before this booking can be confirmed';
  }
  return message || 'Confirm failed';
}

export default function BookingListPage({ type, serviceTenant, statusFilter, assignmentFilter }) {
  const { canAssignVendor, canSeeFinance } = useAdminAccess();
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [assignBooking, setAssignBooking] = useState(null);

  const load = () => {
    setLoading(true);
    fetchAdminBookings({
      type,
      status: statusFilter,
      serviceTenant,
      assignmentStatus: assignmentFilter,
    })
      .then(setData)
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [type, serviceTenant, statusFilter, assignmentFilter]);

  const handleConfirm = async (bookingId) => {
    try {
      await updateBookingStatus(bookingId, 'CONFIRMED');
      toast.success('Booking confirmed');
      load();
    } catch (error) {
      toast.error(confirmBookingErrorMessage(error));
    }
  };

  const columns = [
    { key: 'bookingNumber', label: 'Booking #' },
    { key: 'type', label: 'Type' },
    {
      key: 'serviceTenant',
      label: 'Tenant',
      render: (r) => r.serviceTenant || '—',
    },
    {
      key: 'assignment',
      label: 'Assignment',
      render: (r) =>
        r.serviceTenant ? (
          <span className={r.assignmentStatus === 'UNASSIGNED' ? 'font-medium text-amber-700' : 'text-emerald-700'}>
            {r.assignmentStatus || '—'}
          </span>
        ) : (
          '—'
        ),
    },
    { key: 'customer', label: 'Customer', render: (r) => r.customer?.name || '—' },
    {
      key: 'idProofDoc',
      label: 'ID document',
      render: (r) => {
        const url = r.guestRegistration?.idProof?.documentUrl;
        if (!url) return '—';
        return (
          <a href={getMediaUrl(url)} target="_blank" rel="noopener noreferrer" className="text-admin-primary underline text-xs">
            View
          </a>
        );
      },
    },
    { key: 'item', label: 'Item', render: (r) => bookingTitle(r) },
    ...(canSeeFinance ? [{ key: 'total', label: 'Total', render: (r) => formatCurrency(r.total) }] : []),
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'payment', label: 'Payment', render: (r) => <StatusBadge status={r.paymentStatus} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => {
        if (canAssignVendor && r.serviceTenant && r.assignmentStatus === 'UNASSIGNED') {
          return (
            <button type="button" className="admin-btn-primary !py-1.5 !px-3 text-xs" onClick={() => setAssignBooking(r)}>
              Assign vendor
            </button>
          );
        }
        if (canAssignVendor && r.status === 'PENDING') {
          return (
            <button
              type="button"
              className="admin-btn-secondary !py-1.5 !px-3 text-xs"
              onClick={() => handleConfirm(r._id)}
            >
              Confirm
            </button>
          );
        }
        return '—';
      },
    },
  ];

  const title = pageTitle({ type, serviceTenant, statusFilter, assignmentFilter });
  const subtitle =
    assignmentFilter === 'UNASSIGNED'
      ? 'Open service requests waiting for a vendor — assign from here'
      : 'Enterprise booking operations — assign vendors for open service requests';

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      {loading ? <div className="admin-card p-12 text-center">Loading...</div> : <DataTable columns={columns} data={data.items} />}
      {assignBooking && (
        <AssignVendorModal booking={assignBooking} onClose={() => setAssignBooking(null)} onAssigned={load} />
      )}
    </div>
  );
}
