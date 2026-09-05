import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { HOMESTAY_VILLA } from '../../../constants/homestayVillaLabels';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Skeleton from '../../../components/ui/Skeleton';
import api from '../../../services/api';
import {
  fetchAdminDrivers,
  fetchAdminGuides,
  fetchAdminProperties,
} from '../../../services/enterpriseAdminApi';

const TENANTS = [
  { id: 'HOTEL', label: 'Hotels' },
  { id: 'RESORT', label: 'Resorts' },
  { id: 'HOMESTAY', label: HOMESTAY_VILLA.plural },
  { id: 'GUIDE', label: 'Guides' },
  { id: 'TAXI', label: 'Taxi' },
  { id: 'DRIVER', label: 'Drivers' },
  { id: 'TENT', label: 'Tents' },
  { id: 'HORSE', label: 'Horses' },
];

function reviewListingId(review) {
  const doc =
    review.hotel ||
    review.homestay ||
    review.guide ||
    review.driver ||
    review.tent ||
    review.horse;
  if (!doc) return '';
  return String(doc._id || doc);
}

function bookingLabel(review) {
  return review.booking?.bookingNumber || review.booking?._id || review.booking || '—';
}

async function fetchListingsForTenant(tenant) {
  switch (tenant) {
    case 'HOTEL': {
      const data = await fetchAdminProperties({ type: 'HOTEL', status: 'all', limit: 200 });
      return (data.hotels || []).map((row) => ({ id: String(row._id), name: row.name }));
    }
    case 'RESORT': {
      const data = await fetchAdminProperties({ type: 'RESORT', status: 'all', limit: 200 });
      return (data.hotels || []).map((row) => ({ id: String(row._id), name: row.name }));
    }
    case 'HOMESTAY': {
      const res = await api.get('/admin/enterprise/homestays');
      return (res.data.data || []).map((row) => ({ id: String(row._id), name: row.name }));
    }
    case 'GUIDE': {
      const rows = await fetchAdminGuides();
      return (rows || []).map((row) => ({ id: String(row._id), name: row.name }));
    }
    case 'TAXI': {
      const rows = await fetchAdminDrivers({ vendorType: 'TAXI' });
      return (rows || []).map((row) => ({ id: String(row._id), name: row.name }));
    }
    case 'DRIVER': {
      const rows = await fetchAdminDrivers({ vendorType: 'DRIVER' });
      return (rows || []).map((row) => ({ id: String(row._id), name: row.name }));
    }
    case 'TENT': {
      const res = await api.get('/admin/enterprise/tents');
      return (res.data.data || []).map((row) => ({ id: String(row._id), name: row.name }));
    }
    case 'HORSE': {
      const res = await api.get('/admin/enterprise/horses');
      return (res.data.data || []).map((row) => ({ id: String(row._id), name: row.name }));
    }
    default:
      return [];
  }
}

export default function DeleteReviewsPage() {
  const [tenant, setTenant] = useState('HOTEL');
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewCounts, setReviewCounts] = useState({});
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const tenantLabel = TENANTS.find((t) => t.id === tenant)?.label || tenant;

  const loadTenantData = useCallback(async (nextTenant) => {
    setLoadingListings(true);
    setSelectedListing(null);
    setReviews([]);
    try {
      const [listingRows, reviewsRes] = await Promise.all([
        fetchListingsForTenant(nextTenant),
        api.get('/reviews/admin', { params: { tenant: nextTenant } }),
      ]);
      const allReviews = reviewsRes.data.data || [];
      const counts = {};
      for (const review of allReviews) {
        const id = reviewListingId(review);
        if (!id) continue;
        counts[id] = (counts[id] || 0) + 1;
      }
      setListings(
        listingRows.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
      );
      setReviewCounts(counts);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load listings');
      setListings([]);
      setReviewCounts({});
    } finally {
      setLoadingListings(false);
    }
  }, []);

  const loadListingReviews = useCallback(
    async (listing) => {
      setLoadingReviews(true);
      try {
        const res = await api.get('/reviews/admin', {
          params: { tenant, listingId: listing.id },
        });
        setReviews(res.data.data || []);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load reviews');
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    },
    [tenant]
  );

  useEffect(() => {
    loadTenantData(tenant);
  }, [tenant, loadTenantData]);

  const handleSelectListing = (listing) => {
    setSelectedListing(listing);
    loadListingReviews(listing);
  };

  const handleBackToListings = () => {
    setSelectedListing(null);
    setReviews([]);
  };

  const handleTenantChange = (nextTenant) => {
    setTenant(nextTenant);
  };

  const handleDelete = async (review) => {
    const ok = window.confirm(
      `Delete this review from ${review.user?.name || 'Guest'}? This cannot be undone.`
    );
    if (!ok) return;
    setDeletingId(review._id);
    try {
      await api.delete(`/reviews/${review._id}`);
      toast.success('Review deleted');
      if (selectedListing) {
        await loadListingReviews(selectedListing);
        setReviewCounts((prev) => ({
          ...prev,
          [selectedListing.id]: Math.max(0, (prev[selectedListing.id] || 1) - 1),
        }));
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const listingsWithCounts = useMemo(
    () =>
      listings.map((listing) => ({
        ...listing,
        reviewCount: reviewCounts[listing.id] || 0,
      })),
    [listings, reviewCounts]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        subtitle="Choose a tenant, pick a listing, then view or remove guest reviews."
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Reviews' },
        ]}
      />

      <div className="admin-card p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tenants</p>
        <div className="flex flex-wrap gap-2">
          {TENANTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTenantChange(item.id)}
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

      {selectedListing ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleBackToListings}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ChevronLeft size={16} />
            Back to {tenantLabel}
          </button>

          <div className="admin-card p-4">
            <h2 className="text-lg font-bold text-slate-900">{selectedListing.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {reviews.length} review{reviews.length === 1 ? '' : 's'}
            </p>
          </div>

          {loadingReviews ? (
            <Skeleton className="h-40" />
          ) : !reviews.length ? (
            <Card className="p-8 text-center text-slate-500">No reviews for this listing yet.</Card>
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
                      {' · booking '}
                      {bookingLabel(review)}
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
      ) : loadingListings ? (
        <Skeleton className="h-40" />
      ) : !listingsWithCounts.length ? (
        <Card className="p-8 text-center text-slate-500">
          No listings found for {tenantLabel}.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listingsWithCounts.map((listing) => (
            <button
              key={listing.id}
              type="button"
              onClick={() => handleSelectListing(listing)}
              className="admin-card p-4 text-left transition hover:border-primary/30 hover:shadow-md"
            >
              <p className="font-semibold text-slate-900">{listing.name}</p>
              <p className="mt-2 text-sm text-slate-500">
                {listing.reviewCount} review{listing.reviewCount === 1 ? '' : 's'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
