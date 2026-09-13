import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PropertyCard from '../../components/property/PropertyCard';
import BookingSearchBar from '../../components/search/BookingSearchBar';
import Skeleton from '../../components/ui/Skeleton';
import { globalSearch } from '../../services/listingsApi';
import { dummyHotels } from '../../data/dummyListings';
import { normalizeHotel } from '../../utils/listingHelpers';
import { HOMESTAY_VILLA } from '../../constants/homestayVillaLabels';

const EMPTY_RESULTS = {
  hotels: [],
  tents: [],
  guides: [],
  drivers: [],
  homestays: [],
  horses: [],
};

function ResultSection({ title, items, linkPrefix, itemType, priceKey, priceSuffix }) {
  if (!items.length) return null;
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {items.map((item) => (
        <PropertyCard
          key={`${itemType}-${item._id}`}
          item={item}
          linkPrefix={linkPrefix}
          itemType={itemType}
          priceKey={priceKey}
          priceSuffix={priceSuffix}
        />
      ))}
    </section>
  );
}

export default function SearchPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const q = params.get('q') || 'Mahabaleshwar';
  const [results, setResults] = useState(EMPTY_RESULTS);
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
        ) : total === 0 ? (
          <p className="mt-8 text-slate-500">No results found. Try a different search.</p>
        ) : (
          <div className="mt-8 space-y-10">
            <ResultSection
              title="Hotels"
              items={results.hotels.filter((h) => String(h.type || 'HOTEL').toUpperCase() !== 'RESORT')}
              linkPrefix="/hotels"
              itemType="HOTEL"
            />
            <ResultSection
              title="Resorts"
              items={results.hotels.filter((h) => String(h.type || '').toUpperCase() === 'RESORT')}
              linkPrefix="/resorts"
              itemType="RESORT"
            />
            <ResultSection title={HOMESTAY_VILLA.plural} items={results.homestays} linkPrefix="/homestays" itemType="HOMESTAY" />
            <ResultSection title="Tent stays & glamping" items={results.tents} linkPrefix="/tents" itemType="TENT" priceKey="pricePerNight" />
            <ResultSection title={t('serviceBooking.guideTitle')} items={results.guides} linkPrefix="/guides" itemType="GUIDE" priceKey="package6hr" priceSuffix="/ 6 hrs" />
            <ResultSection title={`${t('serviceBooking.taxiTitle')} & ${t('serviceBooking.driverTitle')}`} items={results.drivers} linkPrefix="/taxi" itemType="TAXI" priceKey="perTripPrice" priceSuffix="/ trip" />
            <ResultSection title={t('serviceBooking.horseTitle')} items={results.horses} linkPrefix="/horses" itemType="HORSE" priceKey="priceFrom" priceSuffix="/ ride" />
          </div>
        )}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">{t('serviceBooking.bookExperiences')}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Link to="/guides/book" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">{t('serviceBooking.guideTitle')}</Link>
            <Link to="/tents" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">{t('nav.tents')}</Link>
            <Link to="/taxi/book" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">{t('serviceBooking.taxiTitle')}</Link>
            <Link to="/drivers/book" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">{t('serviceBooking.driverTitle')}</Link>
            <Link to="/horses/book" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">{t('serviceBooking.horseTitle')}</Link>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/homestays" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">{HOMESTAY_VILLA.plural}</Link>
          <Link to="/hotels" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">Hotels</Link>
          <Link to="/resorts" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">Resorts</Link>
        </div>
      </div>
    </div>
  );
}
