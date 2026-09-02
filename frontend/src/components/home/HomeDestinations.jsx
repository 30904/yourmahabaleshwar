import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { popularDestinations } from '../../data/dummyListings';
import HomeSectionHeader from './HomeSectionHeader';

const countKeys = {
  Mahabaleshwar: 'home.destinations.mahabaleshwarCount',
  Panchgani: 'home.destinations.panchganiCount',
  Tapola: 'home.destinations.tapolaCount',
  Pratapgad: 'home.destinations.pratapgadCount',
};

export default function HomeDestinations() {
  const { t } = useTranslation();

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="page-container">
        <HomeSectionHeader
          eyebrow={t('home.destinations.eyebrow')}
          title={t('home.destinations.title')}
          subtitle={t('home.destinations.subtitle')}
          linkTo="/hotels"
          linkLabel={t('common.viewAll')}
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularDestinations.map((d) => (
            <Link key={d.name} to="/hotels" className="home-destination-card group">
              <img src={d.image} alt={d.name} className="home-destination-img" loading="lazy" />
              <div className="home-destination-overlay" />
              <div className="home-destination-content">
                <p className="flex items-center gap-1 text-lg font-bold text-white">
                  <MapPin size={16} />
                  {d.name}
                </p>
                <p className="text-sm text-white/90">{t(countKeys[d.name] || d.count)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
