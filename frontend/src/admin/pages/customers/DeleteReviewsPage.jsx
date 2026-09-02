import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Skeleton from '../../../components/ui/Skeleton';
import api from '../../../services/api';

const TENANTS = [
  { id: 'GUIDE', label: 'Guides' },
  { id: 'TAXI', label: 'Taxi' },
  { id: 'DRIVER', label: 'Drivers' },
  { id: 'TENT', label: 'Tents' },
  { id: 'HORSE', label: 'Horses' },
  { id: 'HOTEL', label: 'Hotels' },
  { id: 'RESORT', label: 'Resorts' },
  { id: 'HOMESTAY', label: 'Homestays' },
];

function listingName(review) {
  return (
    review.hotel?.name ||
    review.tent?.name ||
    review.guide?.name ||
    review.driver?.name ||
    review.homestay?.name ||
    review.horse?.name ||
    'Unassigned listing'
  );
}

function bookingLabel(review) {
  return review.booking?.bookingNumber || review.booking?._id || review.booking || '—';
}

export default function DeleteReviewsPage() {
  const [tenant, setTenant] = useState('GUIDE');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const load = (nextTenant = tenant) => {
    setLoading(true);
    api
      .get('/reviews/admin', { params: { tenant: nextTenant } })
      .then((res) => setReviews(res.data.data || []))
      .catch((e) => {
        toast.error(e.response?.data?.message || 'Failed to load reviews');
        setReviews([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(tenant);
  }, [tenant]);

  const handleDelete = async (review) => {
    const ok = window.confirm(
      `Delete this review from ${review.user?.name || 'Guest'} on ${listingName(review)}? This cannot be undone.`
    );
    if (!ok) return;
    setDeletingId(review._id);
    try {
      await api.delete(`/reviews/${review._id}`);
      toast.success('Review deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delete reviews"
        subtitle="Choose a tenant, then remove any guest comment from that booking type."
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Reviews', to: '/admin/customers/reviews' },
          { label: 'Delete reviews' },
        ]}
      />

      <div className="admin-card p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tenants</p>
        <div className="flex flex-wrap gap-2">
          {TENANTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTenant(item.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tenant === item.id
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-40" />
      ) : !reviews.length ? (
        <Card className="p-8 text-center text-slate-500">
          No reviews for {TENANTS.find((t) => t.id === tenant)?.label || tenant}.
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review._id} className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {review.user?.name || 'Guest'} · {review.rating}/5
                </p>
                <p className="mt-1 text-sm text-slate-600">{review.comment || '—'}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {review.listingType}
                  {review.booking?.serviceTenant ? ` · ${review.booking.serviceTenant}` : ''}
                  {' · '}
                  {listingName(review)}
                  {' · booking '}
                  {bookingLabel(review)}
                  {' · '}
                  {review.isApproved ? 'Approved' : 'Pending'}
                </p>
              </div>
              <Button
                variant="danger"
                className="px-3 py-1.5 text-sm"
                disabled={deletingId === review._id}
                onClick={() => handleDelete(review)}
              >
                {deletingId === review._id ? 'Deleting…' : 'Delete'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
