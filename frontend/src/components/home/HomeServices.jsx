import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Car, Clock, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/format';
import HomeSectionHeader from './HomeSectionHeader';
import { fetchGuides, fetchDrivers } from '../../services/listingsApi';
import { dummyGuides, dummyDrivers } from '../../data/dummyListings';

export default function HomeServices() {
  const { t } = useTranslation();
  const [guide, setGuide] = useState(null);
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    fetchGuides({ limit: 1, featured: 'true' })
      .then((list) => setGuide(list[0] || dummyGuides[0]))
      .catch(() => setGuide(dummyGuides[0]));
    fetchDrivers({ limit: 1, vendorType: 'TAXI' })
      .then((list) => setDriver(list[0] || dummyDrivers[1]))
      .catch(() => setDriver(dummyDrivers[1]));
  }, []);

  if (!guide || !driver) return null;

  return (
    <section className="page-container py-12 sm:py-16">
      <HomeSectionHeader
        eyebrow={t('home.services.eyebrow')}
        title={t('home.services.title')}
        subtitle={t('home.services.subtitle')}
        linkTo="/guides"
        linkLabel={t('common.viewAll')}
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link to={`/guides/${guide.slug}`} className="home-service-card">
          <div className="home-service-img home-service-img-taxi flex items-center justify-center bg-gradient-to-br from-violet-600 to-violet-800">
            <Users size={48} className="text-white/90" />
          </div>
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <span className="home-service-tag">{t('home.services.localGuide')}</span>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{guide.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <Languages size={14} />
              {(guide.languages || []).join(' · ')}
            </p>
            <p className="mt-3 text-sm text-slate-600">{(guide.specialties || []).join(' · ')}</p>
            <p className="mt-auto pt-4 text-lg font-bold text-primary">
              {t('home.services.from')} {formatCurrency(guide.package6hr)}
              <span className="text-sm font-normal text-slate-500"> {t('home.services.per6hrs')}</span>
            </p>
          </div>
        </Link>
        <Link to={`/taxi/${driver.slug}`} className="home-service-card">
          <div className="home-service-img home-service-img-taxi flex items-center justify-center bg-gradient-to-br from-primary to-blue-600">
            <Car size={48} className="text-white/90" />
          </div>
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <span className="home-service-tag">{t('home.services.taxiCab')}</span>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{driver.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <Car size={14} />
              {driver.vehicleType} · AC
            </p>
            <p className="mt-3 flex items-center gap-1 text-sm text-slate-600">
              <Clock size={14} />
              {t('home.services.hourlyTrips')}
            </p>
            <p className="mt-auto pt-4 text-lg font-bold text-primary">
              {t('home.services.from')} {formatCurrency(driver.perTripPrice)}
              <span className="text-sm font-normal text-slate-500"> {t('home.services.perTrip')}</span>
            </p>
          </div>
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link to="/guides" className="btn-outline">
          <Users size={18} />
          {t('home.services.browseGuides')}
        </Link>
        <Link to="/taxi" className="btn-outline">
          <Car size={18} />
          {t('home.services.bookCab')}
        </Link>
      </div>
    </section>
  );
}
