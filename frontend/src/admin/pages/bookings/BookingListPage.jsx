import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import AssignVendorModal from '../../components/AssignVendorModal';
import CreateAdminBookingModal from '../../components/CreateAdminBookingModal';
import RowActions from '../../components/RowActions';
import useAdminAccess from '../../../hooks/useAdminAccess';
import {
  fetchAdminBookings,
  updateBookingStatus,
  adminConfirmBookingArrival,
  adminConfirmBookingEnd,
  adminEmailBookingInvoice,
} from '../../../services/enterpriseAdminApi';
import { downloadInvoice } from '../../../services/bookingsApi';
import { formatCurrency } from '../../../utils/format';
import { bookingTitle } from '../../../utils/listingHelpers';
import { getMediaUrl } from '../../../utils/mediaUrl';
import { HOMESTAY_VILLA } from '../../../constants/homestayVillaLabels';
import { bookingSourceMeta } from '../../../constants/bookingSource';
import {
  isTripServiceBooking,
  hasVendorArrived,
  isArrivalConfirmed,
  isEndProposed,
  isServiceEnded,
  SERVICE_OVERTIME_PER_HOUR,
} from '../../../constants/serviceTrip';

function canShowInvoiceActions(booking) {
  return (
    booking?.status === 'COMPLETED' ||
    booking?.paymentStatus === 'PAID' ||
    !!booking?.invoiceUrl ||
    !!booking?.invoiceNumber ||
    isServiceEnded(booking)
  );
}
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
  const [showCreate, setShowCreate] = useState(false);
  const [endBooking, setEndBooking] = useState(null);
  const [overtimeHours, setOvertimeHours] = useState('0');
  const [busyId, setBusyId] = useState(null);

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

  const handleConfirmArrival = async (bookingId) => {
    setBusyId(bookingId);
    try {
      await adminConfirmBookingArrival(bookingId);
      toast.success('Arrival confirmed');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Arrival confirm failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmEnd = async () => {
    if (!endBooking) return;
    const hours = Math.max(0, Number(overtimeHours) || 0);
    setBusyId(endBooking._id);
    try {
      await adminConfirmBookingEnd(endBooking._id, { overtimeHours: hours });
      toast.success('Booking ended');
      setEndBooking(null);
      setOvertimeHours('0');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'End confirm failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleDownloadInvoice = async (booking) => {
    setBusyId(booking._id);
    try {
      await downloadInvoice(booking._id);
      toast.success('Invoice downloaded');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invoice download failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleCopyInvoiceLink = async (booking) => {
    if (!booking.invoiceUrl) {
      toast.error('No invoice yet — download once to generate, then copy the link');
      return;
    }
    const url = getMediaUrl(booking.invoiceUrl);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Invoice link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleEmailInvoice = async (booking) => {
    const defaultEmail = booking.customer?.email || booking.guestRegistration?.leadGuest?.email || '';
    const email = window.prompt('Send invoice to email:', defaultEmail);
    if (email === null) return;
    if (!String(email).trim()) {
      toast.error('Email is required');
      return;
    }
    setBusyId(booking._id);
    try {
      const result = await adminEmailBookingInvoice(booking._id, { email: String(email).trim() });
      toast.success(`Invoice emailed to ${result?.emailedTo || email}`);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to email invoice');
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    {
      key: 'bookingNumber',
      label: 'Booking #',
      render: (r) => {
        const src = bookingSourceMeta(r.bookingSource);
        return (
          <div>
            <p className={`text-[10px] font-semibold leading-tight ${src.className}`}>{src.label}</p>
            <p className="text-sm text-slate-800">{r.bookingNumber || '—'}</p>
          </div>
        );
      },
    },
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
      key: 'tripArrival',
      label: 'Arrival',
      render: (r) => {
        if (!isTripServiceBooking(r)) return '—';
        if (isArrivalConfirmed(r)) {
          const at = r.arrivalConfirmedAt || r.guideReachedAt;
          return (
            <span className="font-medium text-emerald-700">
              Confirmed
              {at ? ` · ${new Date(at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
            </span>
          );
        }
        if (hasVendorArrived(r)) return <span className="text-amber-700">Awaiting confirm</span>;
        if (r.assignmentStatus === 'ASSIGNED') return <span className="text-slate-500">Not marked</span>;
        return '—';
      },
    },
    {
      key: 'tripEnd',
      label: 'Ended / OT',
      render: (r) => {
        if (!isTripServiceBooking(r)) return '—';
        if (isServiceEnded(r)) {
          return (
            <span className="font-medium text-slate-800">
              Ended
              {r.overtimeHours > 0
                ? ` · OT ${r.overtimeHours}h (${formatCurrency(r.overtimeAmount || 0)})`
                : ' · No OT'}
            </span>
          );
        }
        if (isEndProposed(r)) {
          return (
            <span className="text-amber-700">
              Awaiting confirm
              {r.overtimeHours > 0 ? ` · OT ${r.overtimeHours}h` : ''}
            </span>
          );
        }
        if (isArrivalConfirmed(r)) return <span className="text-slate-600">In progress</span>;
        return '—';
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => {
        const items = [];
        if (canAssignVendor && r.serviceTenant && r.assignmentStatus === 'UNASSIGNED') {
          items.push({
            key: 'assign',
            label: 'Assign vendor',
            onClick: () => setAssignBooking(r),
          });
        }
        if (canAssignVendor && r.status === 'PENDING' && r.assignmentStatus !== 'UNASSIGNED') {
          items.push({
            key: 'confirm',
            label: 'Confirm',
            onClick: () => handleConfirm(r._id),
          });
        }
        if (
          isTripServiceBooking(r) &&
          r.assignmentStatus === 'ASSIGNED' &&
          r.vendor &&
          !isServiceEnded(r) &&
          !['CANCELLED', 'REFUNDED'].includes(r.status)
        ) {
          if (!isArrivalConfirmed(r)) {
            items.push({
              key: 'arrival',
              label: 'Confirm arrival',
              disabled: busyId === r._id,
              onClick: () => handleConfirmArrival(r._id),
            });
          }
          if (isArrivalConfirmed(r) || isEndProposed(r)) {
            items.push({
              key: 'end',
              label: 'Confirm end',
              disabled: busyId === r._id,
              onClick: () => {
                setEndBooking(r);
                setOvertimeHours(String(r.overtimeHours || 0));
              },
            });
          }
        }
        if (canShowInvoiceActions(r)) {
          items.push(
            {
              key: 'dl-invoice',
              label: 'Download invoice',
              disabled: busyId === r._id,
              onClick: () => handleDownloadInvoice(r),
            },
            {
              key: 'copy-invoice',
              label: 'Copy link',
              disabled: busyId === r._id || !r.invoiceUrl,
              onClick: () => handleCopyInvoiceLink(r),
            },
            {
              key: 'email-invoice',
              label: 'Email invoice',
              disabled: busyId === r._id,
              onClick: () => handleEmailInvoice(r),
            }
          );
        }
        if (!items.length) return '—';
        return <RowActions items={items} label={`Actions for ${r.bookingNumber || 'booking'}`} />;
      },
    },
  ];

  const title = pageTitle({ type, serviceTenant, statusFilter, assignmentFilter });
  const subtitle =
    assignmentFilter === 'UNASSIGNED'
      ? 'Open service requests waiting for a vendor — assign from here'
      : 'Enterprise booking operations — create call/walk-in bookings and manage trip confirmations';

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <button type="button" className="admin-btn-primary" onClick={() => setShowCreate(true)}>
            + Create booking
          </button>
        }
      />
      {loading ? <div className="admin-card p-12 text-center">Loading...</div> : <DataTable columns={columns} data={data.items} />}
      {assignBooking && (
        <AssignVendorModal booking={assignBooking} onClose={() => setAssignBooking(null)} onAssigned={load} />
      )}
      {showCreate && <CreateAdminBookingModal onClose={() => setShowCreate(false)} onCreated={load} />}
      {endBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Confirm end booking</h3>
            <p className="mt-1 text-sm text-slate-600">
              {endBooking.bookingNumber} — overtime at {formatCurrency(SERVICE_OVERTIME_PER_HOUR)}/hr
            </p>
            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Overtime hours</span>
              <input
                type="number"
                min="0"
                step="0.5"
                className="admin-input"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(e.target.value)}
              />
            </label>
            <p className="mt-2 text-sm text-slate-600">
              OT charge:{' '}
              {formatCurrency(Math.round((Number(overtimeHours) || 0) * SERVICE_OVERTIME_PER_HOUR))}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => {
                  setEndBooking(null);
                  setOvertimeHours('0');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                disabled={busyId === endBooking._id}
                onClick={handleConfirmEnd}
              >
                Confirm end
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
