import { Link } from 'react-router-dom';
import { Hotel, Star, Tent, Users, Car, Home, Trees } from 'lucide-react';

const categories = [
  { to: '/hotels', icon: Hotel, label: 'Hotels', count: '450+ stays', color: 'bg-blue-50 text-primary' },
  { to: '/resorts', icon: Star, label: 'Resorts', count: '80+ resorts', color: 'bg-amber-50 text-amber-700' },
  { to: '/homestays', icon: Home, label: 'Homestays', count: 'Local homes', color: 'bg-rose-50 text-rose-700' },
  { to: '/tents', icon: Tent, label: 'Tents & camps', count: '50+ glamping', color: 'bg-emerald-50 text-emerald-700' },
  { to: '/guides', icon: Users, label: 'Local guides', count: '100+ experts', color: 'bg-violet-50 text-violet-700' },
  { to: '/taxi', icon: Car, label: 'Taxi & cabs', count: '200+ vehicles', color: 'bg-slate-100 text-slate-700' },
  { to: '/horses', icon: Trees, label: 'Horse rides', count: 'Scenic trails', color: 'bg-orange-50 text-orange-700' },
];

export default function HomeCategoryStrip() {
  return (
    <section className="page-container relative z-10 -mt-8 sm:-mt-10">
      <div className="home-category-grid">
        {categories.map((c) => (
          <Link key={c.to} to={c.to} className="home-category-card">
            <div className={`home-category-icon ${c.color}`}>
              <c.icon size={22} strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold text-slate-900">{c.label}</p>
              <p className="text-xs text-slate-500">{c.count}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
