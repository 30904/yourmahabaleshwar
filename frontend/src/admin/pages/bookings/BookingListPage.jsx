import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { fetchAdminBookings, updateBookingStatus } from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';
import { bookingTitle } from '../../../utils/listingHelpers';

export default function BookingListPage({ type, statusFilter }) {
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchAdminBookings({ type, status: statusFilter })
      .then(setData)
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [type, statusFilter]);

  const columns = [
    { key: 'bookingNumber', label: 'Booking #' },
    { key: 'type', label: 'Type' },
    { key: 'customer', label: 'Customer', render: (r) => r.customer?.name || '—' },
    { key: 'item', label: 'Item', render: (r) => bookingTitle(r) },
    { key: 'total', label: 'Total', render: (r) => formatCurrency(r.total) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'payment', label: 'Payment', render: (r) => <StatusBadge status={r.paymentStatus} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status === 'PENDING' ? (
          <button type="button" className="text-sm font-medium text-primary" onClick={() => updateBookingStatus(r._id, 'CONFIRMED').then(load)}>
            Confirm
          </button>
        ) : (
          '—'
        ),
    },
  ];

  const title = statusFilter === 'CANCELLED' ? 'Cancelled Bookings' : type ? `${type} Bookings` : 'All Bookings';

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle="Enterprise booking operations" />
      {loading ? <div className="admin-card p-12 text-center">Loading...</div> : <DataTable columns={columns} data={data.items} />}
    </div>
  );
}
