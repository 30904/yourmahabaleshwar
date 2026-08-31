import { useEffect, useState } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Clock, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { fetchMyStaySubscriptions, payForStaySubscriptionRenewal } from '../../services/staySubscriptionApi';
import { formatCurrency } from '../../utils/format';
import { ROLES } from '../../constants/roles';
import VendorServiceSubscription from './VendorServiceSubscription';

const STAY_ROLES = new Set([ROLES.HOTEL_VENDOR, ROLES.HOMESTAY_VENDOR]);
const SERVICE_ROLES = new Set([
  ROLES.GUIDE,
  ROLES.TAXI_OPERATOR,
  ROLES.DRIVER,
  ROLES.TENT_OPERATOR,
  ROLES.HORSE_OPERATOR,
]);

function statusColor(status) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'EXPIRED') return 'danger';
  if (status === 'PENDING_PAYMENT') return 'warning';
  return 'default';
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function VendorStaySubscription() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState(null);

  const load = () => {
    setLoading(true);
    fetchMyStaySubscriptions()
      .then(setItems)
      .catch(() => toast.error(t('staySubscription.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [t]);

  const renew = async (item) => {
    setRenewingId(String(item.listingId));
    try {
      await payForStaySubscriptionRenewal(item.listingType, item.listingId, user);
      toast.success(t('staySubscription.renewSuccess'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t('staySubscription.renewFailed'));
    } finally {
      setRenewingId(null);
    }
  };

  if (loading) return <Skeleton className="h-48" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t('staySubscription.title')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('staySubscription.subtitle')}</p>
      </div>

      {!items.length ? (
        <Card className="p-8 text-center text-slate-500">{t('staySubscription.empty')}</Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const canRenew =
              item.subscriptionStatus === 'EXPIRED' ||
              item.subscriptionStatus === 'PENDING_PAYMENT' ||
              (item.subscriptionStatus === 'ACTIVE' && item.endingSoon);

            return (
              <Card key={`${item.listingType}-${item.listingId}`} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                      <Badge color="default">{item.listingType}</Badge>
                      <Badge color={statusColor(item.subscriptionStatus)}>
                        {t(`staySubscription.status.${item.subscriptionStatus}`, item.subscriptionStatus)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.isVisible ? t('staySubscription.visibleOnSite') : t('staySubscription.hiddenFromSite')}
                    </p>
                  </div>
                  {canRenew && (
                    <Button type="button" disabled={renewingId === String(item.listingId)} onClick={() => renew(item)}>
                      <CreditCard size={16} />
                      {renewingId === String(item.listingId) ? t('common.loading') : t('staySubscription.renewNow')}
                    </Button>
                  )}
                </div>

                {item.endingSoon && item.subscriptionStatus === 'ACTIVE' && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <p>{t('staySubscription.endingSoon', { days: item.daysRemaining })}</p>
                  </div>
                )}

                {item.subscriptionStatus === 'EXPIRED' && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <p>{t('staySubscription.expiredMessage')}</p>
                  </div>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <Calendar size={14} /> {t('staySubscription.startedOn')}
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">{formatDate(item.subscriptionStartedAt)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <Clock size={14} /> {t('staySubscription.expiresOn')}
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">{formatDate(item.subscriptionExpiresAt)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <CheckCircle2 size={14} /> {t('staySubscription.daysRemaining')}
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {item.daysRemaining != null ? item.daysRemaining : '—'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {t('staySubscription.nextRenewalPrice')}
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {item.daysRemaining > 300 && item.subscriptionStatus === 'ACTIVE'
                        ? t('staySubscription.firstYearFree')
                        : formatCurrency(item.renewalPrice || 0)}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function VendorMySubscription() {
  const { user } = useAuth();
  if (SERVICE_ROLES.has(user?.role)) return <VendorServiceSubscription />;
  if (STAY_ROLES.has(user?.role)) return <VendorStaySubscription />;
  return <Card className="p-8 text-center text-slate-500">Subscription not available for your account type.</Card>;
}
