import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { destinations, destinationCopy } from '../../data/destinations';
import HomeSectionHeader from './HomeSectionHeader';

const countKeys = {
  mahabaleshwar: 'home.destinations.mahabaleshwarCount',
  panchgani: 'home.destinations.panchganiCount',
  tapola: 'home.destinations.tapolaCount',
  pratapgad: 'home.destinations.pratapgadCount',
};

export default function HomeDestinations() {
  const { t, i18n } = useTranslation();

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
          {destinations.map((d) => {
            const copy = destinationCopy(d, i18n.language);
            return (
            <Link key={d.slug} to={`/destinations/${d.slug}`} className="home-destination-card group">
              <img src={d.image} alt={copy.name} className="home-destination-img" loading="lazy" />
              <div className="home-destination-overlay" />
              <div className="home-destination-content">
                <p className="flex items-center gap-1 text-lg font-bold text-white">
                  <MapPin size={16} />
                  {copy.name}
                </p>
                <p className="text-sm text-white/90">{t(countKeys[d.slug])}</p>
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
