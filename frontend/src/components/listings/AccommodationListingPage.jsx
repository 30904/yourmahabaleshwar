import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Map, ArrowUpDown } from 'lucide-react';
import { fetchHotels, fetchHomestays, fetchTents } from '../../services/listingsApi';
import PropertyCard from '../property/PropertyCard';
import PropertyFilters from '../property/PropertyFilters';
import BookingSearchBar from '../search/BookingSearchBar';
import Skeleton from '../ui/Skeleton';

function priceOf(item, priceKey) {
  const value = item?.[priceKey] ?? item?.priceFrom ?? item?.pricePerNight ?? 0;
  return Number(value) || 0;
}

function matchesPriceFilter(item, price, priceKey) {
  if (!price || price === 'Any') return true;
  const amount = priceOf(item, priceKey);
  if (price === 'Under ₹2,000') return amount < 2000;
  if (price === '₹2,000 - ₹5,000') return amount >= 2000 && amount <= 5000;
  if (price === '₹5,000+') return amount > 5000;
  return true;
}

function matchesAmenities(item, amenities = []) {
  if (!amenities.length) return true;
  const list = item?.amenities || [];
  return amenities.every((a) => {
    if (a === 'Free cancellation') return true;
    return list.some((x) => String(x).toLowerCase().includes(String(a).toLowerCase()));
  });
}

const FETCHERS = {
  HOTEL: (params) => fetchHotels({ ...params, type: 'HOTEL' }),
  RESORT: (params) => fetchHotels({ ...params, type: 'RESORT' }),
  HOMESTAY: (params) => fetchHomestays(params),
  TENT: (params) => fetchTents(params),
};

export default function AccommodationListingPage({
  title,
  subtitle,
  apiQuery = {},
  fallbackData = [],
  linkPrefix,
  type = 'HOTEL',
  priceKey = 'priceFrom',
  itemType,
}) {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recommended');
  const [filters, setFilters] = useState({});
  const [showMap, setShowMap] = useState(false);

  const listingType = String(type || 'HOTEL').toUpperCase();
  const resolvedPriceKey = listingType === 'TENT' ? 'pricePerNight' : priceKey;
  const resolvedItemType = itemType || listingType;

  useEffect(() => {
    setLoading(true);
    const fetcher = FETCHERS[listingType] || FETCHERS.HOTEL;
    fetcher({ ...apiQuery, limit: 50, search: searchParams.get('q') })
      .then(setItems)
      .catch(() => setItems(fallbackData))
      .finally(() => setLoading(false));
  }, [searchParams, listingType, apiQuery?.type]);

  const sorted = useMemo(() => {
    let list = [...items];
    if (filters.minRating) {
      list = list.filter((i) => (i.score || i.rating || 0) >= filters.minRating);
    }
    if (filters.price) {
      list = list.filter((i) => matchesPriceFilter(i, filters.price, resolvedPriceKey));
    }
    if (filters.amenities?.length) {
      list = list.filter((i) => matchesAmenities(i, filters.amenities));
    }
    if (sort === 'price_low') {
      list.sort((a, b) => priceOf(a, resolvedPriceKey) - priceOf(b, resolvedPriceKey));
    }
    if (sort === 'price_high') {
      list.sort((a, b) => priceOf(b, resolvedPriceKey) - priceOf(a, resolvedPriceKey));
    }
    if (sort === 'rating') {
      list.sort((a, b) => (b.score || b.rating || 0) - (a.score || a.rating || 0));
    }
    return list;
  }, [items, sort, filters, resolvedPriceKey]);

  return (
    <div className="bg-background pb-16">
      <div className="border-b border-border bg-primary py-6 text-white">
        <div className="page-container">
          <BookingSearchBar compact defaultDestination={searchParams.get('q') || ''} />
        </div>
      </div>
      <div className="page-container py-6">
        <nav className="text-sm text-slate-500">Home &gt; {title}</nav>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-1 text-slate-600">
              {subtitle} · <strong>{sorted.length}</strong> properties found
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ArrowUpDown size={16} className="text-slate-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input-field w-auto py-2 pr-8"
            >
              <option value="recommended">Our top picks</option>
              <option value="price_low">Price (lowest first)</option>
              <option value="price_high">Price (highest first)</option>
              <option value="rating">Best reviewed</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                showMap
                  ? 'border-primary bg-primary text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Map size={16} /> Map
            </button>
            <PropertyFilters onChange={setFilters} />
          </div>

          <div className="space-y-4">
            {showMap && (
              <div className="card flex h-48 items-center justify-center bg-slate-100 text-slate-500">
                Map view — integrate Google Maps API
              </div>
            )}
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52" />)
            ) : sorted.length === 0 ? (
              <div className="card p-12 text-center text-slate-500">No properties match your filters.</div>
            ) : (
              sorted.map((item) => (
                <PropertyCard
                  key={item._id}
                  item={item}
                  linkPrefix={linkPrefix}
                  priceKey={resolvedPriceKey}
                  priceSuffix="/ night"
                  itemType={resolvedItemType}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
