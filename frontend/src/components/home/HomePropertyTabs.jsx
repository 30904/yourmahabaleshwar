import { useEffect, useState } from 'react';
import PropertyCard from '../property/PropertyCard';
import HomeSectionHeader from './HomeSectionHeader';
import Skeleton from '../ui/Skeleton';
import { fetchHotels, fetchTents } from '../../services/listingsApi';
import { dummyHotels, dummyResorts, dummyTents } from '../../data/dummyListings';

const tabConfig = [
  { id: 'hotels', label: 'Top hotels', link: '/hotels', prefix: '/hotels', type: 'HOTEL', fallback: dummyHotels.slice(0, 3) },
  { id: 'resorts', label: 'Luxury resorts', link: '/resorts', prefix: '/resorts', type: 'RESORT', fallback: dummyResorts.slice(0, 3) },
  { id: 'tents', label: 'Unique stays', link: '/tents', prefix: '/tents', priceKey: 'pricePerNight', fallback: dummyTents },
];

export default function HomePropertyTabs() {
  const [active, setActive] = useState('hotels');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const current = tabConfig.find((t) => t.id === active) || tabConfig[0];

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      try {
        if (current.id === 'tents') {
          const data = await fetchTents({ limit: 3, featured: 'true' });
          setItems(data.length ? data.slice(0, 3) : current.fallback);
        } else {
          const data = await fetchHotels({ type: current.type, limit: 3, featured: 'true' });
          setItems(data.length ? data.slice(0, 3) : current.fallback);
        }
      } catch {
        setItems(current.fallback);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [active]);

  return (
    <section className="page-container py-4 sm:py-8">
      <HomeSectionHeader
        eyebrow="Guest favourites"
        title="Popular in Mahabaleshwar"
        subtitle="Highly rated properties with great value"
        linkTo={current.link}
      />
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabConfig.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={active === t.id ? 'filter-chip filter-chip-active shrink-0' : 'filter-chip shrink-0'}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52" />)
          : items.map((item) => (
              <PropertyCard
                key={item._id}
                item={item}
                linkPrefix={current.prefix}
                priceKey={current.priceKey || 'priceFrom'}
              />
            ))}
      </div>
    </section>
  );
}
