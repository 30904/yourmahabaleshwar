import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Map, ListFilter, ArrowUpDown } from 'lucide-react';
import { fetchHotels } from '../../services/listingsApi';
import PropertyCard from '../property/PropertyCard';
import PropertyFilters from '../property/PropertyFilters';
import BookingSearchBar from '../search/BookingSearchBar';
import Skeleton from '../ui/Skeleton';

export default function AccommodationListingPage({ title, subtitle, apiQuery, fallbackData, linkPrefix, type = 'HOTEL' }) {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recommended');
  const [filters, setFilters] = useState({});
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchHotels({ ...apiQuery, limit: 50, search: searchParams.get('q') })
      .then(setItems)
      .catch(() => setItems(fallbackData))
      .finally(() => setLoading(false));
  }, [searchParams, apiQuery?.type]);

  const sorted = useMemo(() => {
    let list = [...items];
    if (filters.minRating) list = list.filter((i) => (i.score || i.rating) >= filters.minRating);
    if (sort === 'price_low') list.sort((a, b) => (a.priceFrom || 0) - (b.priceFrom || 0));
    if (sort === 'price_high') list.sort((a, b) => (b.priceFrom || 0) - (a.priceFrom || 0));
    if (sort === 'rating') list.sort((a, b) => (b.score || b.rating || 0) - (a.score || a.rating || 0));
    return list;
  }, [items, sort, filters]);

  return (
    <div className="bg-background pb-16">
      <div className="border-b border-border bg-primary py-6 text-white">
        <div className="page-container">
          <BookingSearchBar compact />
        </div>
      </div>
      <div className="page-container py-6">
        <nav className="text-sm text-slate-500">Home &gt; {title}</nav>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-1 text-slate-600">{subtitle} · <strong>{sorted.length}</strong> properties found</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowMap(!showMap)} className={`filter-chip ${showMap ? 'filter-chip-active' : ''}`}><Map size={16} /> Map</button>
            <span className="filter-chip lg:hidden"><ListFilter size={16} /> Filters</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ArrowUpDown size={16} className="text-slate-400" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field w-auto py-2 pr-8">
              <option value="recommended">Our top picks</option>
              <option value="price_low">Price (lowest first)</option>
              <option value="price_high">Price (highest first)</option>
              <option value="rating">Best reviewed</option>
            </select>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <PropertyFilters onChange={setFilters} />
          <div className="space-y-4">
            {showMap && (
              <div className="card flex h-48 items-center justify-center bg-slate-100 text-slate-500">Map view — integrate Google Maps API</div>
            )}
            {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52" />) :
              sorted.length === 0 ? <div className="card p-12 text-center text-slate-500">No properties match your filters.</div> :
              sorted.map((item) => <PropertyCard key={item._id} item={item} linkPrefix={linkPrefix} priceKey={type === 'tent' ? 'pricePerNight' : 'priceFrom'} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
