import { Link } from 'react-router-dom';
import { ShieldCheck, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BookingSearchBar from '../search/BookingSearchBar';

const HERO_IMG =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85';

export default function HomeHero() {
  const { t } = useTranslation();

  const stats = [
    { value: '450+', labelKey: 'home.statProperties' },
    { value: '12k+', labelKey: 'home.statReviews' },
    { value: '4.8', labelKey: 'home.statRating' },
  ];

  const quickLinks = [
    { to: '/hotels', labelKey: 'home.quickHotels' },
    { to: '/resorts', labelKey: 'home.quickResorts' },
    { to: '/tents', labelKey: 'home.quickGlamping' },
    { to: '/search?freeCancellation=1', labelKey: 'home.quickFreeCancellation' },
  ];

  return (
    <section className="home-hero">
      <img src={HERO_IMG} alt="" className="home-hero-bg" aria-hidden />
      <div className="home-hero-overlay" />
      <div className="page-container relative pb-20 pt-10 sm:pb-24 sm:pt-14 lg:pb-28">
        <div className="flex flex-wrap items-center gap-2">
          <span className="home-hero-pill">
            <ShieldCheck size={14} />
            {t('home.badgeTrusted')}
          </span>
          <span className="home-hero-pill home-hero-pill-muted">
            <Star size={14} className="fill-amber-300 text-amber-300" />
            {t('home.badgeLoved')}
          </span>
        </div>

        <h1 className="home-hero-title">{t('home.headline')}</h1>
        <p className="home-hero-subtitle">{t('home.subhead')}</p>

        <div className="mt-8 flex flex-wrap gap-6 sm:gap-10">
          {stats.map((s) => (
            <div key={s.labelKey}>
              <p className="text-2xl font-extrabold text-white sm:text-3xl">{s.value}</p>
              <p className="text-sm text-blue-100/90">{t(s.labelKey)}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <BookingSearchBar />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-blue-100/80">{t('home.popular')}</span>
          {quickLinks.map((q) => (
            <Link key={q.to} to={q.to} className="home-quick-chip">
              {t(q.labelKey)}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
