import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PropertyCard from '../property/PropertyCard';
import HomeSectionHeader from './HomeSectionHeader';
import Skeleton from '../ui/Skeleton';
import Button from '../ui/Button';
import { fetchHotels } from '../../services/listingsApi';
import { dummyHotels, dummyResorts, dummyTents } from '../../data/dummyListings';

export default function HomePropertyTabs() {
  const { t } = useTranslation();
  const [active, setActive] = useState('hotels');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabConfig = useMemo(
    () => [
      { id: 'hotels', labelKey: 'home.propertyTabs.topHotels', link: '/hotels', prefix: '/hotels', type: 'HOTEL', fallback: dummyHotels.slice(0, 3) },
      { id: 'resorts', labelKey: 'home.propertyTabs.luxuryResorts', link: '/resorts', prefix: '/resorts', type: 'RESORT', fallback: dummyResorts.slice(0, 3) },
      { id: 'tents', labelKey: 'home.propertyTabs.uniqueStays', link: '/tents/book', prefix: '/tents/book', priceKey: 'pricePerNight', fallback: dummyTents, serviceBook: true },
    ],
    []
  );

  const current = tabConfig.find((tab) => tab.id === active) || tabConfig[0];

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      const tab = tabConfig.find((item) => item.id === active) || tabConfig[0];
      if (tab.serviceBook) {
        setItems([]);
        setLoading(false);
        return;
      }
      try {
        const data = await fetchHotels({ type: tab.type, limit: 3, featured: 'true' });
        setItems(data.length ? data.slice(0, 3) : tab.fallback);
      } catch {
        setItems(tab.fallback);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [active, tabConfig]);

  return (
    <section className="page-container py-4 sm:py-8">
      <HomeSectionHeader
        eyebrow={t('home.propertyTabs.eyebrow')}
        title={t('home.propertyTabs.title')}
        subtitle={t('home.propertyTabs.subtitle')}
        linkTo={current.link}
        linkLabel={t('common.viewAll')}
      />
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={active === tab.id ? 'filter-chip filter-chip-active shrink-0' : 'filter-chip shrink-0'}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {current.serviceBook ? (
          <div className="card flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-slate-600">{t('serviceBooking.tentHubDesc')}</p>
            <p className="text-sm text-slate-500">{t('serviceBooking.noVendorPick')}</p>
            <Link to="/tents/book">
              <Button>{t('serviceBooking.bookNow')}</Button>
            </Link>
          </div>
        ) : loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52" />)
        ) : (
          items.map((item) => (
            <PropertyCard
              key={item._id}
              item={item}
              linkPrefix={current.prefix}
              priceKey={current.priceKey || 'priceFrom'}
            />
          ))
        )}
      </div>
    </section>
  );
}
