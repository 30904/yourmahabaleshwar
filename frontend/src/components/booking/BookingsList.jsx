import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import { formatCurrency } from '../../utils/format';
import { bookingTitle } from '../../utils/listingHelpers';
import { fetchMyBookings, fetchVendorBookings, fetchAllBookings, updateBookingStatus, downloadInvoice, vendorMarkArrived, confirmServiceArrival, vendorProposeEnd, confirmServiceEnd } from '../../services/bookingsApi';
import {
  SERVICE_OVERTIME_PER_HOUR,
  isTripServiceBooking,
  hasVendorArrived,
  isArrivalConfirmed,
  isEndProposed,
  isServiceEnded,
} from '../../constants/serviceTrip';
import { fetchVendorMonetizationGate } from '../../services/serviceMonetizationApi';
import { payForBooking, requestRefund, getRefundPreview } from '../../services/paymentsApi';
import { createReview } from '../../services/listingsApi';
import { getMediaUrl } from '../../utils/mediaUrl';
import { useAuth } from '../../context/AuthContext';

const statusColor = {
  CONFIRMED: 'success',
  PENDING: 'warning',
  CANCELLED: 'danger',
  COMPLETED: 'primary',
  REFUNDED: 'default',
};

export default function BookingsList({ mode = 'customer', allowStatusUpdate = false, refreshKey = 0 }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDraft, setReviewDraft] = useState({});
  const [monetizationGate, setMonetizationGate] = useState(null);
  const [endBookingId, setEndBookingId] = useState(null);
  const [overtimeHours, setOvertimeHours] = useState('0');
  const [endingBooking, setEndingBooking] = useState(false);

  const load = () => {
    setLoading(true);
    const fn = mode === 'admin' ? fetchAllBookings : mode === 'vendor' ? fetchVendorBookings : fetchMyBookings;
    fn()
      .then(setBookings)
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [mode, refreshKey]);

  useEffect(() => {
    if (mode !== 'vendor' || !allowStatusUpdate) return;
    fetchVendorMonetizationGate()
      .then(setMonetizationGate)
      .catch(() => setMonetizationGate(null));
  }, [mode, allowStatusUpdate]);

  const handleStatus = async (id, status) => {
    try {
      await updateBookingStatus(id, status);
      toast.success(`Booking ${status.toLowerCase()}`);
      load();
      if (mode === 'vendor' && allowStatusUpdate) {
        fetchVendorMonetizationGate().then(setMonetizationGate).catch(() => {});
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    }
  };

  const canVendorConfirm = (booking) => {
    if (!allowStatusUpdate || booking.status !== 'PENDING') return { ok: false };
    if (booking.assignmentStatus === 'UNASSIGNED' || !booking.vendor) {
      return { ok: false, reason: t('serviceSubscription.awaitingAssignment') };
    }
    if (booking.serviceTenant && monetizationGate?.supported && !monetizationGate.canAcceptBookings) {
      return { ok: false, reason: t('serviceSubscription.confirmBlocked') };
    }
    return { ok: true };
  };

  const handlePay = async (b) => {
    try {
      await payForBooking(b, user);
      toast.success('Payment successful');
      load();
    } catch (e) {
      toast.error(e.message || 'Payment failed');
    }
  };

  const handleRefund = async (b) => {
    try {
      const preview = await getRefundPreview(b._id);
      const ok = window.confirm(`Estimated refund: ${formatCurrency(preview.amount)} (${preview.type}). Continue?`);
      if (!ok) return;
      await requestRefund(b._id, 'Customer cancellation');
      toast.success('Cancellation / refund submitted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Refund failed');
    }
  };

  const handleGuideReached = async (b) => {
    try {
      const ok = window.confirm(t('booking.confirmArrivalAsk'));
      if (!ok) return;
      await confirmServiceArrival(b._id);
      toast.success(t('booking.confirmArrivalSuccess'));
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('booking.confirmArrivalFailed'));
    }
  };

  const handleVendorArrived = async (b) => {
    try {
      const ok = window.confirm(t('booking.vendorArrivedAsk'));
      if (!ok) return;
      await vendorMarkArrived(b._id);
      toast.success(t('booking.vendorArrivedSuccess'));
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('booking.vendorArrivedFailed'));
    }
  };

  const handleConfirmEnd = async (b) => {
    try {
      const ok = window.confirm(
        b.overtimeHours > 0
          ? t('booking.confirmEndWithOvertime', {
              hours: b.overtimeHours,
              amount: formatCurrency(b.overtimeAmount || 0),
            })
          : t('booking.confirmEndAsk')
      );
      if (!ok) return;
      await confirmServiceEnd(b._id);
      toast.success(t('booking.confirmEndSuccess'));
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('booking.confirmEndFailed'));
    }
  };

  const isActiveTrip = (b) =>
    isTripServiceBooking(b) &&
    b.assignmentStatus === 'ASSIGNED' &&
    !!b.vendor &&
    !isServiceEnded(b) &&
    !['CANCELLED', 'REFUNDED'].includes(b.status);

  const canVendorMarkArrived = (b) =>
    mode === 'vendor' && isActiveTrip(b) && !hasVendorArrived(b);

  const canCustomerConfirmArrival = (b) =>
    mode === 'customer' && isActiveTrip(b) && hasVendorArrived(b) && !isArrivalConfirmed(b);

  const canVendorProposeEnd = (b) =>
    mode === 'vendor' && isActiveTrip(b) && isArrivalConfirmed(b) && !isEndProposed(b);

  const canCustomerConfirmEnd = (b) =>
    mode === 'customer' && isActiveTrip(b) && isEndProposed(b);

  const handleProposeEnd = async (b) => {
    const hours = Math.max(0, Number(overtimeHours) || 0);
    const overtimeCharge = Math.round(hours * SERVICE_OVERTIME_PER_HOUR);
    const ok = window.confirm(
      hours > 0
        ? t('booking.proposeEndWithOvertime', {
            hours,
            amount: formatCurrency(overtimeCharge),
          })
        : t('booking.proposeEndAsk')
    );
    if (!ok) return;
    setEndingBooking(true);
    try {
      await vendorProposeEnd(b._id, { overtimeHours: hours });
      toast.success(t('booking.proposeEndSuccess'));
      setEndBookingId(null);
      setOvertimeHours('0');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('booking.proposeEndFailed'));
    } finally {
      setEndingBooking(false);
    }
  };

  const handleInvoice = async (b) => {
    try {
      await downloadInvoice(b._id);
    } catch {
      toast.error('Invoice download failed');
    }
  };

  const handleReview = async (b) => {
    const draft = reviewDraft[b._id] || {};
    if (!draft.rating) {
      toast.error('Select a rating');
      return;
    }
    try {
      await createReview({ bookingId: b._id, rating: Number(draft.rating), comment: draft.comment || '' });
      toast.success(t('booking.reviewPublished'));
      setReviewDraft((prev) => ({ ...prev, [b._id]: {} }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Review failed');
    }
  };

  if (loading) return <Skeleton className="h-32" />;

  if (!bookings.length) {
    return <Card className="p-8 text-center text-slate-500">No bookings yet.</Card>;
  }

  return (
    <div className="space-y-4">
      {mode === 'vendor' && allowStatusUpdate && monetizationGate?.supported && (
        <>
          {monetizationGate.insufficientPoints && !monetizationGate.hasUnlimited && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p>{t('serviceSubscription.insufficientMessage', { required: monetizationGate.pointsPerBooking })}</p>
                <Link to="/dashboard/vendor/subscription" className="mt-1 inline-block font-semibold underline">
                  {t('serviceSubscription.rechargeNow')}
                </Link>
              </div>
            </div>
          )}
          {monetizationGate.lowPoints && !monetizationGate.hasUnlimited && !monetizationGate.insufficientPoints && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p>{t('serviceSubscription.lowPointsMessage')}</p>
            </div>
          )}
          {monetizationGate.endingSoon && monetizationGate.hasUnlimited && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p>{t('serviceSubscription.unlimitedEndingSoon', { days: monetizationGate.unlimitedDaysRemaining })}</p>
            </div>
          )}
        </>
      )}

      {bookings.map((b) => {
        const confirmGate = canVendorConfirm(b);
        return (
          <Card key={b._id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">{bookingTitle(b)}</p>
                <p className="text-sm text-slate-500">
                  {b.bookingNumber || b._id} · {b.type}
                  {b.checkIn && ` · ${new Date(b.checkIn).toLocaleDateString()}`}
                </p>
                {mode === 'vendor' && b.assignmentStatus === 'ASSIGNED' && (
                  <p className="mt-1 text-xs text-emerald-700">{t('serviceBooking.assignedToYou')}</p>
                )}
                {mode !== 'customer' && b.customer?.name && (
                  <p className="text-sm text-slate-600">
                    {b.customer.name}
                    {b.customer.phone ? ` · ${b.customer.phone}` : b.customer.email ? ` · ${b.customer.email}` : ''}
                  </p>
                )}
                {b.guestRegistration?.leadGuest?.fullName && (
                  <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">Guest registration</p>
                    <p className="mt-1">
                      {b.guestRegistration.leadGuest.fullName}
                      {b.guestRegistration.leadGuest.mobile ? ` · ${b.guestRegistration.leadGuest.mobile}` : ''}
                      {b.guests?.adults != null ? ` · ${b.guests.adults} adults` : ''}
                      {b.guests?.children ? ` · ${b.guests.children} children` : ''}
                    </p>
                    {b.guestRegistration.idProof?.type && (
                      <p className="mt-0.5">
                        ID: {b.guestRegistration.idProof.type}
                        {b.guestRegistration.idProof.number ? ` · ${b.guestRegistration.idProof.number}` : ''}
                        {b.guestRegistration.idProof.nationality ? ` · ${b.guestRegistration.idProof.nationality}` : ''}
                        {b.guestRegistration.idProof.documentUrl && (
                          <>
                            {' · '}
                            <a
                              href={getMediaUrl(b.guestRegistration.idProof.documentUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline"
                            >
                              View document
                            </a>
                          </>
                        )}
                      </p>
                    )}
                    {b.guestRegistration.coTravellers?.length > 0 && (
                      <p className="mt-0.5">
                        Co-travellers:{' '}
                        {b.guestRegistration.coTravellers.map((c) => c.fullName).filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                )}
                {b.refundStatus && b.refundStatus !== 'NONE' && (
                  <p className="mt-1 text-xs text-slate-500">{t('booking.refundStatus')}: {b.refundStatus} {b.refundAmount ? `· ${formatCurrency(b.refundAmount)}` : ''}</p>
                )}
                {isTripServiceBooking(b) && hasVendorArrived(b) && !isArrivalConfirmed(b) && (
                  <p className="mt-1 text-xs font-medium text-amber-700">{t('booking.statusVendorArrived')}</p>
                )}
                {isTripServiceBooking(b) && isArrivalConfirmed(b) && !isEndProposed(b) && !isServiceEnded(b) && (
                  <p className="mt-1 text-xs font-medium text-emerald-700">
                    {t('booking.statusArrivalConfirmed')}
                    {b.arrivalConfirmedAt || b.guideReachedAt
                      ? ` · ${new Date(b.arrivalConfirmedAt || b.guideReachedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
                      : ''}
                  </p>
                )}
                {isTripServiceBooking(b) && isEndProposed(b) && (
                  <p className="mt-1 text-xs font-medium text-amber-800">
                    {t('booking.statusEndProposed')}
                    {b.overtimeHours > 0
                      ? ` · ${t('booking.overtimeSummary', {
                          hours: b.overtimeHours,
                          amount: formatCurrency(b.overtimeAmount || 0),
                        })}`
                      : ` · ${t('booking.noOvertime')}`}
                  </p>
                )}
                {isTripServiceBooking(b) && isServiceEnded(b) && (
                  <p className="mt-1 text-xs font-medium text-slate-700">
                    {t('booking.statusEnded')}
                    {b.serviceEndedAt || b.guideEndedAt
                      ? ` · ${new Date(b.serviceEndedAt || b.guideEndedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
                      : ''}
                    {b.overtimeHours > 0
                      ? ` · ${t('booking.overtimeSummary', {
                          hours: b.overtimeHours,
                          amount: formatCurrency(b.overtimeAmount || 0),
                        })}`
                      : ''}
                  </p>
                )}
              </div>
              <Badge color={statusColor[b.status] || 'default'}>{b.status}</Badge>
              <p className="font-bold text-primary">{formatCurrency(b.total)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {mode === 'customer' && b.paymentStatus === 'PENDING' && (
                <Button className="px-3 py-1.5 text-sm" onClick={() => handlePay(b)}>{t('booking.payNow')}</Button>
              )}
              {mode === 'customer' && (b.paymentStatus === 'PAID' || b.invoiceUrl || b.invoiceNumber || b.status === 'COMPLETED') && (
                <Button className="px-3 py-1.5 text-sm" variant="outline" onClick={() => handleInvoice(b)}>{t('booking.downloadInvoice')}</Button>
              )}
              {mode === 'customer' && ['CONFIRMED', 'PENDING'].includes(b.status) && b.paymentStatus === 'PAID' && (
                <Button className="px-3 py-1.5 text-sm" variant="outline" onClick={() => handleRefund(b)}>{t('booking.requestRefund')}</Button>
              )}
              {canCustomerConfirmArrival(b) && (
                <Button className="px-3 py-1.5 text-sm" onClick={() => handleGuideReached(b)}>
                  {t('booking.confirmArrivalButton')}
                </Button>
              )}
              {canVendorMarkArrived(b) && (
                <Button className="px-3 py-1.5 text-sm" onClick={() => handleVendorArrived(b)}>
                  {t('booking.vendorArrivedButton')}
                </Button>
              )}
              {canVendorProposeEnd(b) && endBookingId !== b._id && (
                <Button
                  className="px-3 py-1.5 text-sm"
                  variant="outline"
                  onClick={() => {
                    setEndBookingId(b._id);
                    setOvertimeHours('0');
                  }}
                >
                  {t('booking.proposeEndButton')}
                </Button>
              )}
              {canCustomerConfirmEnd(b) && (
                <Button className="px-3 py-1.5 text-sm" onClick={() => handleConfirmEnd(b)}>
                  {t('booking.confirmEndButton')}
                </Button>
              )}
              {allowStatusUpdate && b.status === 'PENDING' && (
                <>
                  <Button
                    className="px-3 py-1.5 text-sm"
                    disabled={!confirmGate.ok}
                    title={confirmGate.reason || ''}
                    onClick={() => handleStatus(b._id, 'CONFIRMED')}
                  >
                    Confirm
                  </Button>
                  <Button className="px-3 py-1.5 text-sm" variant="outline" onClick={() => handleStatus(b._id, 'CANCELLED')}>Cancel</Button>
                  {!confirmGate.ok && confirmGate.reason && (
                    <p className="w-full text-xs text-red-600">{confirmGate.reason}</p>
                  )}
                </>
              )}
            </div>
            {canVendorProposeEnd(b) && endBookingId === b._id && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-800">{t('booking.proposeEndTitle')}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {t('booking.proposeEndOvertimeHint', { rate: formatCurrency(SERVICE_OVERTIME_PER_HOUR) })}
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div className="min-w-[140px]">
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      {t('booking.overtimeHours')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="input-field"
                      value={overtimeHours}
                      onChange={(e) => setOvertimeHours(e.target.value)}
                    />
                  </div>
                  <p className="pb-2 text-sm text-slate-700">
                    {t('booking.overtimeChargePreview', {
                      amount: formatCurrency(Math.round((Number(overtimeHours) || 0) * SERVICE_OVERTIME_PER_HOUR)),
                    })}
                  </p>
                  <Button
                    className="px-3 py-1.5 text-sm"
                    disabled={endingBooking}
                    onClick={() => handleProposeEnd(b)}
                  >
                    {t('booking.proposeEndConfirm')}
                  </Button>
                  <Button
                    className="px-3 py-1.5 text-sm"
                    variant="outline"
                    disabled={endingBooking}
                    onClick={() => {
                      setEndBookingId(null);
                      setOvertimeHours('0');
                    }}
                  >
                    {t('booking.close')}
                  </Button>
                </div>
              </div>
            )}
            {mode === 'customer' && (b.status === 'COMPLETED' || b.paymentStatus === 'PAID') && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="mb-2 text-sm font-medium">{t('booking.writeReview')}</p>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="input-field max-w-[100px]"
                    value={reviewDraft[b._id]?.rating || ''}
                    onChange={(e) => setReviewDraft((p) => ({ ...p, [b._id]: { ...p[b._id], rating: e.target.value } }))}
                  >
                    <option value="">Rating</option>
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <input
                    className="input-field flex-1"
                    placeholder="Comment"
                    value={reviewDraft[b._id]?.comment || ''}
                    onChange={(e) => setReviewDraft((p) => ({ ...p, [b._id]: { ...p[b._id], comment: e.target.value } }))}
                  />
                  <Button className="px-3 py-1.5 text-sm" onClick={() => handleReview(b)}>Submit</Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
