import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { fetchVendorReviews } from '../../services/vendorListingsApi';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/format';
import { VERTICAL_LABEL_KEY } from './vendorListingFormConfig';

const listingEditPath = (item) => {
  if (!item.listingType || !item.listingId) return null;
  return `/dashboard/vendor/listings/${item.listingType}/${item.listingId}/edit`;
};

export default function VendorReviews() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchVendorReviews({ page, limit: 20 })
      .then((data) => {
        setItems(data.items || []);
        setPages(data.pages || 0);
        setTotal(data.total || 0);
      })
      .catch(() => {
        setItems([]);
        toast.error(t('vendor.reviewsLoadFailed'));
      })
      .finally(() => setLoading(false));
  }, [page, t]);

  if (loading) return <Skeleton className="h-48" />;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">{t('vendor.reviews')}</h2>
      <p className="mt-1 text-sm text-slate-500">{t('vendor.reviewsHint')}</p>

      {!items.length ? (
        <Card className="mt-6 p-8 text-center">
          <p className="text-slate-500">{t('vendor.noReviews')}</p>
        </Card>
      ) : (
        <>
          <div className="mt-6 space-y-3 md:hidden">
            {items.map((item) => (
              <ReviewCard key={item.id} item={item} t={t} />
            ))}
          </div>
          <Card className="mt-6 hidden overflow-x-auto p-0 md:block" padding={false}>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t('vendor.businessName')}</th>
                  <th className="px-5 py-3 font-semibold">{t('vendor.reviewRating')}</th>
                  <th className="px-5 py-3 font-semibold">{t('vendor.reviewComment')}</th>
                  <th className="px-5 py-3 font-semibold">{t('vendor.bookingRef')}</th>
                  <th className="px-5 py-3 font-semibold">{t('common.status')}</th>
                  <th className="px-5 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const to = listingEditPath(item);
                  return (
                    <tr key={item.id} className="border-b border-slate-50 align-top last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{item.listingName || '—'}</p>
                        <p className="text-xs text-slate-500">
                          {item.listingType ? t(VERTICAL_LABEL_KEY[item.listingType] || 'vendor.listings') : ''}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{item.createdAt ? formatDate(item.createdAt) : ''}</p>
                      </td>
                      <td className="px-5 py-3">
                        <StarRating rating={item.rating} />
                      </td>
                      <td className="max-w-xs px-5 py-3 text-slate-600">{item.comment || '—'}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{item.bookingRef || '—'}</td>
                      <td className="px-5 py-3">
                        <ApprovalBadge approved={item.isApproved} t={t} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        {to ? (
                          <Link to={to} className="text-sm font-medium text-primary hover:underline">
                            {t('vendor.viewListing')}
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <p>{t('vendor.reviewsPage', { page, pages, total })}</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t('vendor.reviewsPrev')}
            </Button>
            <Button variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              {t('vendor.reviewsNext')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReviewCard({ item, t }) {
  const to = listingEditPath(item);
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{item.listingName || '—'}</p>
          <p className="text-xs text-slate-500">
            {item.listingType ? t(VERTICAL_LABEL_KEY[item.listingType] || 'vendor.listings') : ''}
          </p>
        </div>
        <ApprovalBadge approved={item.isApproved} t={t} />
      </div>
      <div className="mt-2">
        <StarRating rating={item.rating} />
      </div>
      <p className="mt-2 text-sm text-slate-600">{item.comment || '—'}</p>
      <p className="mt-2 font-mono text-xs text-slate-400">{item.bookingRef || '—'}</p>
      {to ? (
        <Link to={to} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
          {t('vendor.viewListing')}
        </Link>
      ) : null}
    </Card>
  );
}

function ApprovalBadge({ approved, t }) {
  return (
    <Badge color={approved ? 'success' : 'warning'}>
      {approved ? t('vendor.reviewApproved') : t('vendor.reviewPending')}
    </Badge>
  );
}

function StarRating({ rating = 0 }) {
  const value = Math.round(Number(rating) || 0);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
        />
      ))}
    </span>
  );
}
