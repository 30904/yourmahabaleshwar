import { Link } from 'react-router-dom';
import { Users, Car, Clock, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HomeSectionHeader from './HomeSectionHeader';

export default function HomeServices() {
  const { t } = useTranslation();

  return (
    <section className="page-container py-12 sm:py-16">
      <HomeSectionHeader
        eyebrow={t('home.services.eyebrow')}
        title={t('home.services.title')}
        subtitle={t('home.services.subtitle')}
        linkTo="/guides/book"
        linkLabel={t('common.viewAll')}
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link to="/guides/book" className="home-service-card">
          <div className="home-service-img home-service-img-taxi flex items-center justify-center bg-gradient-to-br from-violet-600 to-violet-800">
            <Users size={48} className="text-white/90" />
          </div>
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <span className="home-service-tag">{t('home.services.localGuide')}</span>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{t('serviceBooking.guideTitle')}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <Languages size={14} />
              {t('serviceBooking.guideFeature1')}
            </p>
            <p className="mt-3 text-sm text-slate-600">{t('serviceBooking.noVendorPick')}</p>
            <p className="mt-auto pt-4 text-sm font-semibold text-primary">{t('serviceBooking.bookNow')} →</p>
          </div>
        </Link>
        <Link to="/taxi/book" className="home-service-card">
          <div className="home-service-img home-service-img-taxi flex items-center justify-center bg-gradient-to-br from-primary to-blue-600">
            <Car size={48} className="text-white/90" />
          </div>
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <span className="home-service-tag">{t('home.services.taxiCab')}</span>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{t('serviceBooking.taxiTitle')}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <Car size={14} />
              {t('serviceBooking.taxiFeature1')}
            </p>
            <p className="mt-3 flex items-center gap-1 text-sm text-slate-600">
              <Clock size={14} />
              {t('home.services.hourlyTrips')}
            </p>
            <p className="mt-auto pt-4 text-sm font-semibold text-primary">{t('serviceBooking.bookNow')} →</p>
          </div>
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link to="/guides/book" className="btn-outline">
          <Users size={18} />
          {t('home.services.browseGuides')}
        </Link>
        <Link to="/taxi/book" className="btn-outline">
          <Car size={18} />
          {t('home.services.bookCab')}
        </Link>
      </div>
    </section>
  );
}
