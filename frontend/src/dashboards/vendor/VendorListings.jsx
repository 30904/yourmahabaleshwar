import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { fetchMyVendorListings } from '../../services/vendorListingsApi';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { formatCurrency } from '../../utils/format';

const CREATE_PATH = '/dashboard/vendor/listings/new';

const editPath = (item) => `/dashboard/vendor/listings/${item.vertical}/${item.id}/edit`;

function CreateListingButton({ label, className = '' }) {
  return (
    <Link to={CREATE_PATH} className={`btn-primary inline-flex items-center gap-2 ${className}`}>
      <Plus size={16} />
      {label}
    </Link>
  );
}

export default function VendorListings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.role) return;
    setLoading(true);
    fetchMyVendorListings(user.role)
      .then(setListings)
      .catch(() => {
        setListings([]);
        toast.error(t('vendor.listingsLoadFailed'));
      })
      .finally(() => setLoading(false));
  }, [user?.role, t]);

  const createLabel = t('vendor.createListing');

  if (loading) return <Skeleton className="h-48" />;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('vendor.listings')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('vendor.listingsHint')}</p>
        </div>
        <CreateListingButton label={createLabel} />
      </div>

      {!listings.length ? (
        <Card className="mt-6 p-8 text-center">
          <p className="text-slate-500">{t('vendor.noListings')}</p>
          <CreateListingButton label={createLabel} className="mt-4" />
        </Card>
      ) : (
        <>
          <div className="mt-6 space-y-3 md:hidden">
            {listings.map((item) => (
              <ListingCard key={`${item.vertical}-${item.id}`} item={item} t={t} />
            ))}
          </div>
          <Card className="mt-6 hidden overflow-x-auto p-0 md:block" padding={false}>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t('vendor.businessName')}</th>
                  <th className="px-5 py-3 font-semibold">{t('vendor.listingsSlug')}</th>
                  <th className="px-5 py-3 font-semibold">{t('vendor.fromPrice')}</th>
                  <th className="px-5 py-3 font-semibold">{t('common.status')}</th>
                  <th className="px-5 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {listings.map((item) => (
                  <tr key={`${item.vertical}-${item.id}`} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{t(item.labelKey)}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{item.slug || '—'}</td>
                    <td className="px-5 py-3 font-semibold text-primary">
                      {item.prices?.from != null ? formatCurrency(item.prices.from) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge active={item.isActive} t={t} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <EditLink to={editPath(item)} label={t('vendor.editListingShort')} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

function ListingCard({ item, t }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{item.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">{t(item.labelKey)}</p>
          <p className="mt-1 font-mono text-xs text-slate-400">{item.slug || '—'}</p>
        </div>
        <StatusBadge active={item.isActive} t={t} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-lg font-bold text-primary">
          {item.prices?.from != null ? formatCurrency(item.prices.from) : '—'}
        </p>
        <EditLink to={editPath(item)} label={t('vendor.editListingShort')} />
      </div>
    </Card>
  );
}

function StatusBadge({ active, t }) {
  return (
    <Badge color={active ? 'success' : 'neutral'}>
      {active ? t('vendor.listingActive') : t('vendor.listingPending')}
    </Badge>
  );
}

function EditLink({ to, label }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
      <Pencil size={14} />
      {label}
    </Link>
  );
}
