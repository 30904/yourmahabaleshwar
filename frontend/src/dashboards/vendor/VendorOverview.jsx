import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../../components/ui/Skeleton';
import api from '../../services/api';
import { fetchVendorBookings } from '../../services/bookingsApi';
import { fetchMyVendorListings, fetchVendorReviews } from '../../services/vendorListingsApi';
import { formatCurrency } from '../../utils/format';
import { listingStatusOf } from '../../utils/listingStatus';
import { getVendorNav, vendorDashboardTitleKey } from './vendorNav';

const OPEN_STATUSES = ['PENDING', 'CONFIRMED'];
const CLOSED_STATUSES = ['CANCELLED', 'REFUNDED'];

function startOfDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function greetingKey(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'vendor.goodMorning';
  if (hour < 17) return 'vendor.goodAfternoon';
  return 'vendor.goodEvening';
}

function moneyOf(rows) {
  return rows.reduce((sum, booking) => sum + (Number(booking.total) || 0), 0);
}

function listingName(booking) {
  return booking.hotel?.name
    || booking.homestay?.name
    || booking.tent?.name
    || booking.guide?.name
    || booking.driver?.name
    || booking.horse?.name
    || booking.product?.name
    || booking.combo?.title
    || booking.combo?.name
    || '';
}

function guestName(booking, fallback) {
  return booking.guestRegistration?.leadGuest?.fullName || booking.customer?.name || fallback;
}

export default function VendorOverview() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [kyc, setKyc] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const role = user?.role;

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchVendorBookings().catch(() => []),
      api.get('/users/kyc').then((r) => r.data.data).catch(() => null),
      api.get('/admin/wallet').then((r) => r.data.data).catch(() => null),
      api.get('/admin/subscriptions/me').then((r) => r.data.data).catch(() => null),
      role ? fetchMyVendorListings(role).catch(() => []) : Promise.resolve([]),
      fetchVendorReviews({ page: 1, limit: 100 }).catch(() => ({ items: [], total: 0 })),
    ]).then(([rows, kycDoc, walletDoc, subDoc, listingRows, reviewDoc]) => {
      if (!active) return;
      setBookings(Array.isArray(rows) ? rows : []);
      setKyc(kycDoc);
      setWallet(walletDoc);
      setSubscription(subDoc);
      setListings(Array.isArray(listingRows) ? listingRows : []);
      setReviews(reviewDoc && Array.isArray(reviewDoc.items) ? reviewDoc : { items: [], total: 0 });
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [role]);

  if (loading) return <Skeleton className="h-64" />;

  const today = startOfDay(new Date());
  const month = today.getMonth();
  const year = today.getFullYear();
  const paid = bookings.filter((booking) => booking.paymentStatus === 'PAID' && !CLOSED_STATUSES.includes(booking.status));
  const paidThisMonth = paid.filter((booking) => {
    const created = new Date(booking.createdAt || booking.checkIn);
    return !Number.isNaN(created.getTime()) && created.getMonth() === month && created.getFullYear() === year;
  });
  const awaiting = bookings.filter((booking) => booking.paymentStatus === 'PENDING' && OPEN_STATUSES.includes(booking.status));
  const pending = bookings.filter((booking) => booking.status === 'PENDING');
  const confirmed = bookings.filter((booking) => booking.status === 'CONFIRMED');
  const completed = bookings.filter((booking) => booking.status === 'COMPLETED').length;
  const cancelled = bookings.filter((booking) => CLOSED_STATUSES.includes(booking.status)).length;
  const scheduled = bookings
    .map((booking) => ({ booking, day: startOfDay(booking.checkIn || booking.createdAt) }))
    .filter((row) => row.day && OPEN_STATUSES.includes(row.booking.status));
  const todayCount = scheduled.filter((row) => row.day.getTime() === today.getTime()).length;
  const upcomingCount = scheduled.filter((row) => row.day.getTime() > today.getTime()).length;
  const comingUp = scheduled
    .filter((row) => row.day.getTime() >= today.getTime())
    .sort((a, b) => a.day - b.day)
    .slice(0, 4);
  const liveListings = listings.filter((item) => listingStatusOf(item) === 'APPROVED').length;
  const waitingListings = listings.filter((item) => listingStatusOf(item) === 'PENDING').length;
  const reviewItems = reviews.items || [];
  const reviewTotal = Number(reviews.total) || reviewItems.length;
  const rating = reviewItems.length
    ? Math.round((reviewItems.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) / reviewItems.length) * 10) / 10
    : null;
  const balance = wallet?.user?.walletBalance ?? subscription?.walletBalance ?? 0;
  const points = wallet?.user?.pointBalance ?? subscription?.pointBalance ?? 0;
  const kycStatus = String(kyc?.status || 'PENDING').toUpperCase();
  const displayName = String(user?.name || '').trim();
  const awaitingAmount = moneyOf(awaiting);

  const alerts = [
    pending.length ? { key: 'pending', text: t('vendor.pendingBookingsNote', { count: pending.length }), to: '/dashboard/vendor/bookings', tone: 'warn' } : null,
    kycStatus === 'REJECTED' ? { key: 'kyc-rejected', text: t('vendor.kycRejectedNote'), to: '/dashboard/vendor/kyc', tone: 'bad' } : null,
    kycStatus !== 'APPROVED' && kycStatus !== 'REJECTED' ? { key: 'kyc', text: t('vendor.kycPendingNote'), to: '/dashboard/vendor/kyc', tone: 'warn' } : null,
    waitingListings ? { key: 'listings', text: t('vendor.listingsWaiting', { count: waitingListings }), to: '/dashboard/vendor/listings', tone: 'info' } : null,
  ].filter(Boolean);

  const manage = getVendorNav(role, t).filter((item) => !item.end);

  const alertTone = {
    warn: 'border-orange-300 bg-orange-50 text-orange-800',
    bad: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  };

  return (
    <div>
      <p className="text-sm font-medium text-slate-500">{t(greetingKey())}{displayName ? `, ${displayName}` : ''}</p>
      <h2 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{t(vendorDashboardTitleKey(role))}</h2>

      {alerts.length ? (
        <section className="mt-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('vendor.needsAction')}</h3>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <Link key={alert.key} to={alert.to} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium ${alertTone[alert.tone]}`}>
                <span>{alert.text}</span>
                <span aria-hidden="true">›</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <Link to="/dashboard/vendor/wallet" className="mt-5 block rounded-2xl border border-blue-300 bg-blue-100 p-5 text-blue-900 sm:p-6">
        <p className="text-sm font-medium">{t('vendor.thisMonth')} · {t('vendor.collected')}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{formatCurrency(moneyOf(paidThisMonth))}</p>
        <p className="mt-1 text-sm">{t('vendor.allTime')} {formatCurrency(moneyOf(paid))}</p>
        {awaitingAmount > 0 ? <p className="mt-2 text-sm font-semibold text-amber-700">{t('vendor.awaitingPayment')} {formatCurrency(awaitingAmount)}</p> : null}
        <div className="mt-4 flex border-t border-blue-300 pt-4">
          <div className="flex-1">
            <p className="text-xs">{t('vendor.balance')}</p>
            <p className="mt-0.5 text-base font-bold text-slate-900">{formatCurrency(balance)}</p>
          </div>
          <div className="mx-4 w-px bg-blue-300" />
          <div className="flex-1">
            <p className="text-xs">{t('vendor.pointsShort')}</p>
            <p className="mt-0.5 text-base font-bold text-slate-900">{points}</p>
          </div>
        </div>
      </Link>

      <section className="mt-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('vendor.bookings')}</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi to="/dashboard/vendor/bookings" label={t('vendor.today')} value={String(todayCount)} hint={t('vendor.upcoming')} hintValue={String(upcomingCount)} />
          <Kpi to="/dashboard/vendor/bookings" label={t('vendor.pending')} value={String(pending.length)} hot={pending.length > 0} />
          <Kpi to="/dashboard/vendor/bookings" label={t('vendor.confirmed')} value={String(confirmed.length)} />
          <Kpi to="/dashboard/vendor/bookings" label={t('vendor.completed')} value={String(completed)} hint={t('vendor.cancelled')} hintValue={String(cancelled)} />
        </div>
      </section>

      <section className="mt-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('vendor.business')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/dashboard/vendor/listings" className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-slate-900">{liveListings}</p>
            <p className="mt-1 text-xs text-slate-500">{t('vendor.liveListings')}</p>
          </Link>
          <Link to="/dashboard/vendor/reviews" className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-slate-900">{rating == null ? '—' : rating.toFixed(1)}</p>
            <p className="mt-1 text-xs text-slate-500">{rating == null ? t('vendor.noReviewsYet') : t('vendor.reviewsCount', { count: reviewTotal })}</p>
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('vendor.nextUp')}</h3>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {!comingUp.length ? <p className="px-4 py-4 text-sm text-slate-500">{t('vendor.noUpcoming')}</p> : comingUp.map(({ booking, day }) => (
            <Link key={booking._id} to="/dashboard/vendor/bookings" className="flex items-center gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0">
              <div className="w-12 text-center">
                <p className="text-lg font-bold leading-5 text-primary">{day.getDate()}</p>
                <p className="text-[11px] font-medium uppercase text-slate-500">{day.toLocaleDateString('en-IN', { month: 'short' })}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{guestName(booking, t('vendor.guest'))}</p>
                <p className="truncate text-xs text-slate-500">{listingName(booking) || booking.type}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${booking.status === 'PENDING' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                {t(booking.status === 'PENDING' ? 'vendor.pending' : 'vendor.confirmed')}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('vendor.manage')}</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {manage.map((item) => (
            <Link key={item.to} to={item.to} className="flex min-h-16 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-primary">
              <span>{item.label}</span>
              <span className="text-lg text-slate-400" aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({ to, label, value, hint, hintValue, hot }) {
  return (
    <Link to={to} className={`block min-h-[92px] rounded-2xl border p-4 ${hot ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${hot ? 'text-amber-700' : 'text-primary'}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint} · {hintValue}</p> : null}
    </Link>
  );
}
