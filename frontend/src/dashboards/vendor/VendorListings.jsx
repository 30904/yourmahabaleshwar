import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, PencilOff, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { fetchMyVendorListings } from '../../services/vendorListingsApi';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { formatCurrency } from '../../utils/format';
import { listingStatusBadgeColor, listingStatusI18nKey, listingStatusOf, canVendorEditListing } from '../../utils/listingStatus';

const CREATE_PATH = '/dashboard/vendor/listings/new';
const STATUS_FILTERS = ['APPROVED', 'PENDING', 'REJECTED'];

const editPath = (item) => `/dashboard/vendor/listings/${item.vertical}/${item.id}/edit`;

function CreateListingButton({ label, className = '' }) {
  return (
    <Link to={CREATE_PATH} className={`btn-primary inline-flex items-center gap-2 ${className}`}>
      <Plus size={16} />
      {label}
    </Link>
  );
}

function StatusFilterButtons({ value, onChange, t }) {
  const activeStyles = {
    APPROVED: 'border-emerald-600 bg-emerald-600 text-white',
    PENDING: 'border-amber-500 bg-amber-500 text-white',
    REJECTED: 'border-red-600 bg-red-600 text-white',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {STATUS_FILTERS.map((status) => {
        const active = value === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(active ? null : status)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              active
                ? activeStyles[status]
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t(listingStatusI18nKey(status))}
          </button>
        );
      })}
    </div>
  );
}

export default function VendorListings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(null);

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

  const filteredListings = useMemo(() => {
    if (!statusFilter) return listings;
    return listings.filter((item) => listingStatusOf(item) === statusFilter);
  }, [listings, statusFilter]);

  const createLabel = t('vendor.createListing');

  if (loading) return <Skeleton className="h-48" />;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('vendor.listings')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('vendor.listingsHint')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusFilterButtons value={statusFilter} onChange={setStatusFilter} t={t} />
          <CreateListingButton label={createLabel} />
        </div>
      </div>

      {!listings.length ? (
        <Card className="mt-6 p-8 text-center">
          <p className="text-slate-500">{t('vendor.noListings')}</p>
          <CreateListingButton label={createLabel} className="mt-4" />
        </Card>
      ) : !filteredListings.length ? (
        <Card className="mt-6 p-8 text-center">
          <p className="text-slate-500">{t('vendor.noListingsForFilter')}</p>
        </Card>
      ) : (
        <>
          <div className="mt-6 space-y-3 md:hidden">
            {filteredListings.map((item) => (
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
                  <th className="px-5 py-3 text-center font-semibold">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((item) => (
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
                      <ListingStatus item={item} t={t} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center">
                        <ListingEditControl item={item} t={t} />
                      </div>
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
        <ListingStatus item={item} t={t} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-lg font-bold text-primary">
          {item.prices?.from != null ? formatCurrency(item.prices.from) : '—'}
        </p>
        <ListingEditControl item={item} t={t} />
      </div>
    </Card>
  );
}

function ListingStatus({ item, t }) {
  const status = listingStatusOf(item);
  return <Badge color={listingStatusBadgeColor(status)}>{t(listingStatusI18nKey(status))}</Badge>;
}

function ListingEditControl({ item, t }) {
  if (!canVendorEditListing(item)) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-300"
        aria-label={t('vendor.listingEditLocked')}
        title={t('vendor.listingEditLocked')}
      >
        <PencilOff size={16} />
      </span>
    );
  }
  return (
    <Link
      to={editPath(item)}
      aria-label={t('vendor.editListingShort')}
      title={t('vendor.editListingShort')}
      className="inline-flex items-center justify-center rounded-md p-1.5 text-primary hover:bg-blue-50"
    >
      <Pencil size={16} />
    </Link>
  );
}
