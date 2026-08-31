import { Link } from 'react-router-dom';
import { Hotel, Star, Tent, Users, Car, CarTaxiFront, Home, Trees } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const categories = [
  { to: '/hotels', icon: Hotel, labelKey: 'home.categories.hotels', countKey: 'home.categories.hotelsCount', color: 'bg-blue-50 text-primary' },
  { to: '/resorts', icon: Star, labelKey: 'home.categories.resorts', countKey: 'home.categories.resortsCount', color: 'bg-amber-50 text-amber-700' },
  { to: '/homestays', icon: Home, labelKey: 'home.categories.homestays', countKey: 'home.categories.homestaysCount', color: 'bg-rose-50 text-rose-700' },
  { to: '/tents/book', icon: Tent, labelKey: 'home.categories.tents', countKey: 'home.categories.tentsCount', color: 'bg-emerald-50 text-emerald-700' },
  { to: '/guides/book', icon: Users, labelKey: 'home.categories.guides', countKey: 'home.categories.guidesCount', color: 'bg-violet-50 text-violet-700' },
  { to: '/drivers/book', icon: Car, labelKey: 'home.categories.driver', countKey: 'home.categories.driverCount', color: 'bg-slate-100 text-slate-700' },
  { to: '/taxi/book', icon: CarTaxiFront, labelKey: 'home.categories.taxi', countKey: 'home.categories.taxiCount', color: 'bg-teal-50 text-teal-700' },
  { to: '/horses/book', icon: Trees, labelKey: 'home.categories.horses', countKey: 'home.categories.horsesCount', color: 'bg-orange-50 text-orange-700' },
];

export default function HomeCategoryStrip() {
  const { t } = useTranslation();

  return (
    <section className="page-container relative z-10 -mt-8 sm:-mt-10">
      <div className="home-category-grid">
        {categories.map((c) => (
          <Link key={c.to} to={c.to} className="home-category-card">
            <div className={`home-category-icon ${c.color}`}>
              <c.icon size={22} strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold text-slate-900">{t(c.labelKey)}</p>
              <p className="text-xs text-slate-500">{t(c.countKey)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
