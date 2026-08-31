import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import { formatCurrency } from '../../utils/format';
import { buildOpenBookingDetailRows } from '../../utils/openBookingDetails';
import { acceptOpenServiceBooking, fetchOpenServiceBookings } from '../../services/openBookingsApi';
import { connectVendorSocket, disconnectVendorSocket } from '../../services/vendorSocket';
import { fetchVendorMonetizationGate } from '../../services/serviceMonetizationApi';

function openBookingLabel(booking, t) {
  const labels = {
    GUIDE: t('openBookings.tenantGuide'),
    TAXI: t('openBookings.tenantTaxi'),
    DRIVER: t('openBookings.tenantDriver'),
    TENT: t('openBookings.tenantTent'),
    HORSE: t('openBookings.tenantHorse'),
  };
  return labels[booking.serviceTenant] || booking.type || t('openBookings.request');
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ConfirmAcceptModal({ booking, open, onClose, onConfirm, confirming, t }) {
  if (!open || !booking) return null;

  const lead = booking.guestRegistration?.leadGuest || {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="accept-booking-title"
      >
        <h2 id="accept-booking-title" className="text-lg font-bold text-slate-900">
          {t('openBookings.confirmTitle')}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {t('openBookings.confirmMessage', {
            bookingNumber: booking.bookingNumber,
            customer: booking.customer?.name || lead.fullName || '—',
          })}
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-900">
          {formatCurrency(booking.total || booking.subtotal || 0)}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="danger" onClick={onClose} disabled={confirming}>
            {t('common.cancel')}
          </Button>
          <Button type="button" variant="success" onClick={onConfirm} disabled={confirming}>
            {confirming ? t('openBookings.accepting') : t('openBookings.confirmYes')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function OpenBookingCard({ booking, accepting, onRequestAccept, t }) {
  const detailRows = buildOpenBookingDetailRows(booking, t);
  const lead = booking.guestRegistration?.leadGuest || {};

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">
            {booking.bookingNumber} · {openBookingLabel(booking, t)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {t('openBookings.customer')}: {booking.customer?.name || lead.fullName || '—'}
            {booking.customer?.phone || lead.mobile ? ` · ${booking.customer?.phone || lead.mobile}` : ''}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {t('openBookings.date')}: {formatDate(booking.checkIn)}
            {booking.checkOut ? ` → ${formatDate(booking.checkOut)}` : ''}
          </p>
        </div>
        <div className="shrink-0 text-left lg:text-right">
          <p className="text-lg font-bold text-slate-900">{formatCurrency(booking.total || booking.subtotal || 0)}</p>
          {booking.gst != null && (
            <p className="text-xs text-slate-500">
              {t('openBookings.details.includesGst', { amount: formatCurrency(booking.gst) })}
            </p>
          )}
        </div>
      </div>

      {detailRows.length > 0 && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('openBookings.details.title')}
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            {detailRows.map((row) => (
              <div key={row.label}>
                <dt className="text-xs font-medium text-slate-500">{row.label}</dt>
                <dd className="mt-0.5 text-sm text-slate-800">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="success" onClick={() => onRequestAccept(booking)} disabled={accepting}>
          {accepting ? t('openBookings.accepting') : t('openBookings.accept')}
        </Button>
      </div>
    </div>
  );
}

export default function OpenBookingsPanel({ onAccepted }) {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [confirmBooking, setConfirmBooking] = useState(null);
  const [monetizationGate, setMonetizationGate] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchOpenServiceBookings()
      .then(setBookings)
      .catch(() => toast.error(t('openBookings.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    load();
    fetchVendorMonetizationGate()
      .then(setMonetizationGate)
      .catch(() => setMonetizationGate(null));
  }, [load]);

  useEffect(() => {
    const socket = connectVendorSocket();
    if (!socket) return undefined;

    const onCreated = (booking) => {
      setBookings((prev) => {
        if (prev.some((row) => row._id === booking._id)) return prev;
        return [booking, ...prev];
      });
      toast.success(t('openBookings.newRequest'));
    };

    const onAccepted = ({ bookingId }) => {
      setBookings((prev) => prev.filter((row) => row._id !== bookingId));
    };

    socket.on('booking:created', onCreated);
    socket.on('booking:accepted', onAccepted);

    return () => {
      socket.off('booking:created', onCreated);
      socket.off('booking:accepted', onAccepted);
      disconnectVendorSocket();
    };
  }, [t]);

  const handleAccept = async (booking) => {
    setAcceptingId(booking._id);
    try {
      await acceptOpenServiceBooking(booking._id);
      toast.success(t('openBookings.accepted'));
      setBookings((prev) => prev.filter((row) => row._id !== booking._id));
      setConfirmBooking(null);
      fetchVendorMonetizationGate().then(setMonetizationGate).catch(() => {});
      onAccepted?.();
    } catch (error) {
      const message = error.response?.data?.message || t('openBookings.acceptFailed');
      const status = error.response?.status;
      if (status === 403) {
        toast.error(message || t('openBookings.rechargeRequired'), { duration: 5000 });
      } else if (status === 409) {
        toast.error(t('openBookings.alreadyTaken'));
        setBookings((prev) => prev.filter((row) => row._id !== booking._id));
      } else {
        toast.error(message);
      }
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <>
      <ConfirmAcceptModal
        booking={confirmBooking}
        open={Boolean(confirmBooking)}
        onClose={() => !acceptingId && setConfirmBooking(null)}
        onConfirm={() => confirmBooking && handleAccept(confirmBooking)}
        confirming={Boolean(confirmBooking && acceptingId === confirmBooking._id)}
        t={t}
      />
      <Card className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            <h3 className="text-lg font-bold text-slate-900">{t('openBookings.title')}</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">{t('openBookings.subtitle')}</p>
        </div>
        <Badge variant="warning">{bookings.length}</Badge>
      </div>

      {monetizationGate?.supported && !monetizationGate.canAcceptBookings && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {t('serviceSubscription.viewOnlyHint')}{' '}
          <Link to="/dashboard/vendor/subscription" className="font-semibold underline">
            {t('openBookings.rechargeLink')}
          </Link>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </>
        ) : bookings.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{t('openBookings.empty')}</p>
        ) : (
          bookings.map((booking) => (
            <OpenBookingCard
              key={booking._id}
              booking={booking}
              accepting={acceptingId === booking._id}
              onRequestAccept={setConfirmBooking}
              t={t}
            />
          ))
        )}
      </div>
    </Card>
    </>
  );
}
