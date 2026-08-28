import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PropertyCard from '../../components/property/PropertyCard';
import BookingSearchBar from '../../components/search/BookingSearchBar';
import Skeleton from '../../components/ui/Skeleton';
import { globalSearch } from '../../services/listingsApi';
import { dummyHotels } from '../../data/dummyListings';
import { normalizeHotel } from '../../utils/listingHelpers';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || 'Mahabaleshwar';
  const [results, setResults] = useState({ hotels: [], tents: [], guides: [], drivers: [], homestays: [], horses: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    globalSearch(q)
      .then((data) => {
        setResults({
          hotels: data.hotels?.length
            ? data.hotels
            : dummyHotels
                .filter((h) => h.name.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes('mahabaleshwar'))
                .map(normalizeHotel),
          tents: data.tents || [],
          guides: data.guides || [],
          drivers: data.drivers || [],
          homestays: data.homestays || [],
          horses: data.horses || [],
        });
      })
      .catch(() => {
        setResults({
          hotels: dummyHotels
            .filter((h) => h.name.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes('mahabaleshwar'))
            .map(normalizeHotel),
          tents: [],
          guides: [],
          drivers: [],
          homestays: [],
          horses: [],
        });
      })
      .finally(() => setLoading(false));
  }, [q]);

  const total =
    results.hotels.length +
    results.tents.length +
    results.guides.length +
    results.drivers.length +
    results.homestays.length +
    results.horses.length;

  return (
    <div className="bg-background pb-16">
      <div className="border-b border-border bg-primary py-6">
        <div className="page-container">
          <BookingSearchBar compact defaultDestination={q} />
        </div>
      </div>
      <div className="page-container py-8">
        <h1 className="text-2xl font-bold">{total} results in {q}</h1>
        <p className="text-slate-600">Best matches for your search</p>
        {loading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-52" />
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {results.hotels.map((h) => (
              <PropertyCard key={h._id} item={h} linkPrefix="/hotels" itemType="HOTEL" />
            ))}
            {results.homestays.map((h) => (
              <PropertyCard key={h._id} item={h} linkPrefix="/homestays" itemType="HOMESTAY" />
            ))}
            {results.tents.map((t) => (
              <PropertyCard key={t._id} item={t} linkPrefix="/tents" priceKey="pricePerNight" itemType="TENT" />
            ))}
            {results.horses.map((h) => (
              <PropertyCard key={h._id} item={h} linkPrefix="/horses" priceSuffix="/ ride" itemType="HORSE" />
            ))}
            {total === 0 && <p className="text-slate-500">No results found. Try a different search.</p>}
          </div>
        )}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Link to="/homestays" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">Homestays</Link>
          <Link to="/tents" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">Browse tents</Link>
          <Link to="/taxi" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">Book taxi</Link>
          <Link to="/drivers" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">Book driver</Link>
          <Link to="/horses" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">Horse rides</Link>
        </div>
      </div>
    </div>
  );
}
