import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  fetchMyAvailability,
  patchListingAvailability,
} from '../../services/vendorListingsApi';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { roleHasAvailability } from './vendorNav';
import {
  dateStatus,
  listingKey,
  monthCells,
  monthWindow,
  shiftMonth,
  todayKey,
} from './vendorAvailabilityCalendar';

const WEEKDAY_KEYS = ['calMon', 'calTue', 'calWed', 'calThu', 'calFri', 'calSat', 'calSun'];

const cellClass = (status, isToday, isPast, busy) => {
  const base =
    'flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium transition disabled:cursor-not-allowed';
  if (status === 'empty') return `${base} invisible`;
  if (status === 'booked') return `${base} cursor-not-allowed bg-sky-100 text-sky-800`;
  if (status === 'blocked') {
    return `${base} bg-red-100 text-red-800 hover:bg-red-200 ${busy ? 'opacity-60' : ''}`;
  }
  return `${base} text-slate-700 hover:bg-primary/10 ${isPast ? 'opacity-40' : ''} ${
    isToday ? 'ring-2 ring-primary ring-offset-1' : ''
  }`;
};

export default function VendorAvailability() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [listings, setListings] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyDate, setBusyDate] = useState('');

  const { from, to } = useMemo(() => monthWindow(year, month), [year, month]);
  const cells = useMemo(() => monthCells(year, month), [year, month]);
  const today = todayKey();

  const selected = listings.find((item) => listingKey(item) === selectedKey) || listings[0];
  const blocked = loading ? [] : selected?.blockedDates || [];
  const booked = loading ? [] : selected?.bookedDates || [];

  useEffect(() => {
    if (!roleHasAvailability(user?.role)) return undefined;
    let cancelled = false;
    setLoading(true);
    fetchMyAvailability(from, to)
      .then((data) => {
        if (cancelled) return;
        const next = data.listings || [];
        setListings(next);
        setSelectedKey((prev) => {
          if (prev && next.some((item) => listingKey(item) === prev)) return prev;
          return next[0] ? listingKey(next[0]) : '';
        });
      })
      .catch(() => {
        if (cancelled) return;
        setListings([]);
        toast.error(t('vendor.availabilityLoadFailed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, user?.role, t]);

  const monthLabel = new Date(year, month, 1).toLocaleDateString(
    i18n.language === 'mr' ? 'mr-IN' : 'en-IN',
    { month: 'long', year: 'numeric' }
  );

  const changeMonth = (delta) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  const onDayClick = async (key) => {
    if (!selected || !key || busyDate || loading) return;
    const status = dateStatus(key, blocked, booked);
    if (status === 'booked') {
      toast.error(t('vendor.bookedDateLocked'));
      return;
    }
    if (key < today) {
      toast.error(t('vendor.pastDateLocked'));
      return;
    }
    setBusyDate(key);
    try {
      const data = await patchListingAvailability(selected.type, selected.id, {
        blockedDates: [key],
        action: status === 'blocked' ? 'remove' : 'add',
      });
      const nextBlocked = data?.blockedDates || [];
      setListings((prev) =>
        prev.map((item) =>
          listingKey(item) === listingKey(selected) ? { ...item, blockedDates: nextBlocked } : item
        )
      );
      toast.success(status === 'blocked' ? t('vendor.dateUnblocked') : t('vendor.dateBlocked'));
    } catch (e) {
      toast.error(e.response?.data?.message || t('vendor.availabilitySaveFailed'));
    } finally {
      setBusyDate('');
    }
  };

  if (!roleHasAvailability(user?.role)) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">{t('vendor.availabilityUnavailable')}</p>
        <Link to="/dashboard/vendor" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          {t('common.back')}
        </Link>
      </Card>
    );
  }

  if (loading && !listings.length) return <Skeleton className="h-80" />;

  if (!listings.length) {
    return (
      <div>
        <h2 className="text-xl font-bold">{t('vendor.availability')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('vendor.availabilityHint')}</p>
        <Card className="mt-6 p-8 text-center">
          <p className="text-slate-500">{t('vendor.noAvailabilityListings')}</p>
          <Link
            to="/dashboard/vendor/listings/new"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            {t('vendor.createListing')}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold">{t('vendor.availability')}</h2>
      <p className="mt-1 text-sm text-slate-500">{t('vendor.availabilityHint')}</p>

      <Card className="mt-6 space-y-5">
        <label className="block text-sm font-medium text-slate-700">
          {t('vendor.selectListing')}
          <select
            className="input-field mt-1.5"
            value={selected ? listingKey(selected) : ''}
            onChange={(e) => setSelectedKey(e.target.value)}
          >
            {listings.map((item) => (
              <option key={listingKey(item)} value={listingKey(item)}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" className="px-2" onClick={() => changeMonth(-1)} aria-label={t('vendor.prevMonth')}>
            <ChevronLeft size={20} />
          </Button>
          <p className="text-sm font-semibold capitalize text-slate-800">{monthLabel}</p>
          <Button variant="ghost" className="px-2" onClick={() => changeMonth(1)} aria-label={t('vendor.nextMonth')}>
            <ChevronRight size={20} />
          </Button>
        </div>

        <div className={`grid grid-cols-7 gap-1 text-center ${loading ? 'pointer-events-none opacity-50' : ''}`}>
          {WEEKDAY_KEYS.map((key) => (
            <div key={key} className="py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t(`vendor.${key}`)}
            </div>
          ))}
          {cells.map((key, index) => {
            const status = dateStatus(key, blocked, booked);
            const isToday = key === today;
            const isPast = Boolean(key && key < today);
            return (
              <button
                key={key || `pad-${index}`}
                type="button"
                disabled={!key || busyDate === key || loading}
                className={cellClass(status, isToday, isPast, busyDate === key)}
                onClick={() => onDayClick(key)}
                title={
                  status === 'booked'
                    ? t('vendor.legendBooked')
                    : status === 'blocked'
                      ? t('vendor.clickToUnblock')
                      : t('vendor.clickToBlock')
                }
              >
                {key ? Number(key.slice(-2)) : ''}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <LegendDot className="bg-white ring-1 ring-slate-200" label={t('vendor.legendAvailable')} />
          <LegendDot className="bg-red-100" label={t('vendor.legendBlocked')} />
          <LegendDot className="bg-sky-100" label={t('vendor.legendBooked')} />
          <LegendDot className="ring-2 ring-primary" label={t('vendor.legendToday')} />
        </div>
      </Card>
    </div>
  );
}

function LegendDot({ className, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${className}`} />
      {label}
    </span>
  );
}
