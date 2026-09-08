import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { fetchMyVendorListings } from '../../services/vendorListingsApi';
import {
  fetchMyHomepageAds,
  fetchVendorAdCatalog,
  payForHomepageAd,
} from '../../services/homepageAdsApi';
import { formatCurrency } from '../../utils/format';
import { ROLES } from '../../constants/roles';

const AD_ROLES = new Set([ROLES.HOTEL_VENDOR, ROLES.HOMESTAY_VENDOR, ROLES.TENT_OPERATOR]);

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function statusColor(status) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'EXPIRED') return 'danger';
  if (status === 'PENDING') return 'warning';
  return 'default';
}

export default function VendorAdvertisements() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [catalog, setCatalog] = useState(null);
  const [listings, setListings] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [packageId, setPackageId] = useState('');
  const [listingKey, setListingKey] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user?.role || !AD_ROLES.has(user.role)) return;
    setLoading(true);
    try {
      const [cat, mine, myAds] = await Promise.all([
        fetchVendorAdCatalog(),
        fetchMyVendorListings(user.role),
        fetchMyHomepageAds(),
      ]);
      setCatalog(cat);
      setListings(mine.filter((item) => String(item.approvalStatus || '').toUpperCase() === 'APPROVED'));
      setAds(myAds);
      if (!packageId && cat?.packages?.[0]?._id) setPackageId(cat.packages[0]._id);
    } catch {
      toast.error(t('vendorAds.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, t]);

  const listingOptions = useMemo(
    () =>
      listings.map((item) => ({
        key: `${item.vertical}:${item.id || item._id}`,
        listingType: item.vertical,
        listingId: item.id || item._id,
        name: item.name,
      })),
    [listings]
  );

  const purchase = async () => {
    if (!packageId) {
      toast.error(t('vendorAds.selectPackage'));
      return;
    }
    if (!listingKey) {
      toast.error(t('vendorAds.selectListing'));
      return;
    }
    const option = listingOptions.find((o) => o.key === listingKey);
    if (!option) return;

    setBusy(true);
    try {
      await payForHomepageAd(
        {
          packageId,
          listingType: option.listingType,
          listingId: option.listingId,
        },
        user
      );
      toast.success(t('vendorAds.purchaseSuccess'));
      setListingKey('');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t('vendorAds.purchaseFailed'));
    } finally {
      setBusy(false);
    }
  };

  if (!AD_ROLES.has(user?.role)) {
    return <Card className="p-8 text-center text-slate-500">{t('vendorAds.notAvailable')}</Card>;
  }

  if (loading) return <Skeleton className="h-48" />;

  const slotsRemaining = catalog?.slotsRemaining ?? 0;
  const maxSlots = catalog?.maxSlots ?? 3;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t('vendorAds.title')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('vendorAds.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t('vendorAds.slotsOpen')}</p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {slotsRemaining}/{maxSlots}
          </p>
        </Card>
        <Card className="p-5 sm:col-span-2">
          <p className="text-sm text-slate-600">{t('vendorAds.slotsHint')}</p>
        </Card>
      </div>

      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Megaphone size={18} className="text-primary" />
          <h3 className="font-semibold text-slate-900">{t('vendorAds.buyTitle')}</h3>
        </div>

        {!listingOptions.length ? (
          <p className="text-sm text-slate-500">{t('vendorAds.noApprovedListings')}</p>
        ) : (
          <>
            <label className="block text-sm font-medium text-slate-700">
              {t('vendorAds.package')}
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
              >
                {(catalog?.packages || []).map((pkg) => (
                  <option key={pkg._id} value={pkg._id}>
                    {pkg.name} — {formatCurrency(pkg.price)} / {pkg.durationDays} {t('vendorAds.days')}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              {t('vendorAds.listing')}
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={listingKey}
                onChange={(e) => setListingKey(e.target.value)}
              >
                <option value="">{t('vendorAds.chooseListing')}</option>
                {listingOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.name} ({opt.listingType})
                  </option>
                ))}
              </select>
            </label>

            <Button type="button" disabled={busy || slotsRemaining <= 0} onClick={purchase}>
              <CreditCard size={16} />
              {busy
                ? t('common.loading')
                : slotsRemaining <= 0
                  ? t('vendorAds.slotsFull')
                  : t('vendorAds.payAndPromote')}
            </Button>
          </>
        )}
      </Card>

      <Card className="space-y-3 p-5">
        <h3 className="font-semibold text-slate-900">{t('vendorAds.historyTitle')}</h3>
        {!ads.length ? (
          <p className="text-sm text-slate-400">{t('vendorAds.historyEmpty')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {ads.map((ad) => (
              <li key={ad._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-slate-900">{ad.title}</p>
                  <p className="text-xs text-slate-500">
                    {ad.listingType} · {formatDate(ad.startDate)} → {formatDate(ad.endDate)} ·{' '}
                    {formatCurrency(ad.amountPaid || 0)}
                  </p>
                </div>
                <Badge color={statusColor(ad.status)}>{ad.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
