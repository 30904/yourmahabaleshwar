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
import { fetchMyBookings, fetchVendorBookings, fetchAllBookings, updateBookingStatus, downloadInvoice } from '../../services/bookingsApi';
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
                  <p className="text-sm text-slate-600">{b.customer.name} · {b.customer.email}</p>
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
              </div>
              <Badge color={statusColor[b.status] || 'default'}>{b.status}</Badge>
              <p className="font-bold text-primary">{formatCurrency(b.total)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {mode === 'customer' && b.paymentStatus === 'PENDING' && (
                <Button className="px-3 py-1.5 text-sm" onClick={() => handlePay(b)}>{t('booking.payNow')}</Button>
              )}
              {mode === 'customer' && (b.paymentStatus === 'PAID' || b.invoiceUrl || b.invoiceNumber) && (
                <Button className="px-3 py-1.5 text-sm" variant="outline" onClick={() => handleInvoice(b)}>{t('booking.downloadInvoice')}</Button>
              )}
              {mode === 'customer' && ['CONFIRMED', 'PENDING'].includes(b.status) && b.paymentStatus === 'PAID' && (
                <Button className="px-3 py-1.5 text-sm" variant="outline" onClick={() => handleRefund(b)}>{t('booking.requestRefund')}</Button>
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
