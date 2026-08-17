import { Link } from 'react-router-dom';
import { ShieldCheck, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BookingSearchBar from '../search/BookingSearchBar';

const HERO_IMG =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85';

const stats = [
  { value: '450+', label: 'Properties' },
  { value: '12k+', label: 'Guest reviews' },
  { value: '4.8', label: 'Average rating' },
];

const quickLinks = [
  { to: '/hotels', label: 'Hotels' },
  { to: '/resorts', label: 'Resorts' },
  { to: '/tents', label: 'Glamping' },
  { to: '/search?freeCancellation=1', label: 'Free cancellation' },
];

export default function HomeHero() {
  const { t } = useTranslation();
  return (
    <section className="home-hero">
      <img src={HERO_IMG} alt="" className="home-hero-bg" aria-hidden />
      <div className="home-hero-overlay" />
      <div className="page-container relative pb-20 pt-10 sm:pb-24 sm:pt-14 lg:pb-28">
        <div className="flex flex-wrap items-center gap-2">
          <span className="home-hero-pill">
            <ShieldCheck size={14} />
            India&apos;s trusted hill-station marketplace
          </span>
          <span className="home-hero-pill home-hero-pill-muted">
            <Star size={14} className="fill-amber-300 text-amber-300" />
            Loved by 50,000+ travellers
          </span>
        </div>

        <h1 className="home-hero-title">
          {t('home.headline')}
        </h1>
        <p className="home-hero-subtitle">
          {t('home.subhead')}
        </p>

        <div className="mt-8 flex flex-wrap gap-6 sm:gap-10">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-white sm:text-3xl">{s.value}</p>
              <p className="text-sm text-blue-100/90">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <BookingSearchBar />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-blue-100/80">Popular:</span>
          {quickLinks.map((q) => (
            <Link key={q.to} to={q.to} className="home-quick-chip">
              {q.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
