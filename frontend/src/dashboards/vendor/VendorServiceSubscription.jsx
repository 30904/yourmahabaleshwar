import { useEffect, useState } from 'react';
import { AlertTriangle, CreditCard, Infinity, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import {
  fetchMyServiceMonetization,
  payForServicePoints,
  payForServiceUnlimited,
} from '../../services/serviceMonetizationApi';
import { formatCurrency } from '../../utils/format';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function VendorServiceSubscription() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState('500');
  const [busy, setBusy] = useState('');

  const load = () => {
    setLoading(true);
    fetchMyServiceMonetization()
      .then(setStatus)
      .catch(() => toast.error(t('serviceSubscription.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [t]);

  const rechargePoints = async () => {
    const amount = Number(rechargeAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t('serviceSubscription.invalidAmount'));
      return;
    }
    setBusy('points');
    try {
      await payForServicePoints(amount, user);
      toast.success(t('serviceSubscription.pointsRecharged'));
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || t('serviceSubscription.rechargeFailed'));
    } finally {
      setBusy('');
    }
  };

  const buyUnlimited = async () => {
    setBusy('unlimited');
    try {
      await payForServiceUnlimited(user);
      toast.success(t('serviceSubscription.unlimitedActivated'));
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || t('serviceSubscription.rechargeFailed'));
    } finally {
      setBusy('');
    }
  };

  if (loading) return <Skeleton className="h-48" />;
  if (!status?.supported) {
    return <Card className="p-8 text-center text-slate-500">{t('serviceSubscription.notAvailable')}</Card>;
  }

  const pointsToGet =
    status.rupeesPerPoint > 0 ? Math.floor(Number(rechargeAmount || 0) / status.rupeesPerPoint) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t('serviceSubscription.title')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('serviceSubscription.subtitle')}</p>
      </div>

      {status.insufficientPoints && !status.hasUnlimited && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>{t('serviceSubscription.insufficientMessage', { required: status.pointsPerBooking })}</p>
        </div>
      )}

      {status.lowPoints && !status.hasUnlimited && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>{t('serviceSubscription.lowPointsMessage')}</p>
        </div>
      )}

      {status.endingSoon && status.hasUnlimited && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>{t('serviceSubscription.unlimitedEndingSoon', { days: status.unlimitedDaysRemaining })}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-5">
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Zap size={16} /> {t('serviceSubscription.pointBalance')}
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">{status.pointBalance}</p>
          <p className="mt-1 text-xs text-slate-500">
            {t('serviceSubscription.pointsPerBooking', { count: status.pointsPerBooking })}
          </p>
        </Card>
        <Card className="p-5">
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Infinity size={16} /> {t('serviceSubscription.unlimitedPlan')}
          </p>
          <p className="mt-2 text-lg font-bold text-slate-900">
            {status.hasUnlimited ? t('serviceSubscription.active') : t('serviceSubscription.notActive')}
          </p>
          {status.hasUnlimited && (
            <p className="mt-1 text-xs text-slate-500">
              {t('serviceSubscription.until')} {formatDate(status.unlimitedExpiresAt)}
            </p>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t('serviceSubscription.canAccept')}</p>
          <Badge className="mt-2" color={status.canAcceptBookings ? 'success' : 'danger'}>
            {status.canAcceptBookings ? t('serviceSubscription.yes') : t('serviceSubscription.no')}
          </Badge>
          <p className="mt-2 text-xs text-slate-500">{t('serviceSubscription.viewOnlyHint')}</p>
        </Card>
      </div>

      <Card className="space-y-4 p-5">
        <h3 className="font-semibold text-slate-900">{t('serviceSubscription.rechargePoints')}</h3>
        <p className="text-sm text-slate-600">
          {t('serviceSubscription.rechargeRate', {
            rate: status.rupeesPerPoint,
            tenant: status.tenantType,
          })}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Input
            type="number"
            min="1"
            label={t('serviceSubscription.amountInr')}
            value={rechargeAmount}
            onChange={(e) => setRechargeAmount(e.target.value)}
            className="max-w-xs"
          />
          <p className="pb-2 text-sm text-slate-600">
            → {pointsToGet} {t('serviceSubscription.points')}
          </p>
          <Button type="button" disabled={busy === 'points'} onClick={rechargePoints}>
            <CreditCard size={16} />
            {busy === 'points' ? t('common.loading') : t('serviceSubscription.rechargeNow')}
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="font-semibold text-slate-900">{t('serviceSubscription.unlimitedMonthly')}</h3>
        <p className="text-sm text-slate-600">{t('serviceSubscription.unlimitedDesc')}</p>
        <p className="text-lg font-bold text-primary">{formatCurrency(status.unlimitedMonthlyPrice)}/month</p>
        <Button type="button" disabled={busy === 'unlimited'} onClick={buyUnlimited}>
          {busy === 'unlimited' ? t('common.loading') : t('serviceSubscription.buyUnlimited')}
        </Button>
      </Card>
    </div>
  );
}
