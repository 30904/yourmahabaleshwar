import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HomeSectionHeader from './HomeSectionHeader';

const dealItems = [
  { id: 'monsoon', gradient: 'bg-gradient-to-br from-blue-600 to-blue-900' },
  { id: 'weekend', gradient: 'bg-gradient-to-br from-emerald-600 to-teal-800' },
  { id: 'earlyBird', gradient: 'bg-gradient-to-br from-amber-500 to-orange-600' },
];

export default function HomeDealsSection() {
  const { t } = useTranslation();

  return (
    <section className="page-container py-12 sm:py-16">
      <HomeSectionHeader
        eyebrow={t('home.deals.eyebrow')}
        title={t('home.deals.title')}
        subtitle={t('home.deals.subtitle')}
        linkTo="/hotels"
        linkLabel={t('home.deals.seeAll')}
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dealItems.map((d) => (
          <Link
            key={d.id}
            to="/hotels"
            className={`group flex min-h-[200px] flex-col overflow-hidden rounded-booking p-6 text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl sm:p-7 ${d.gradient}`}
          >
            <Sparkles size={22} className="opacity-90" />
            <p className="mt-3 text-3xl font-extrabold tracking-tight">{t(`home.deals.${d.id}.discount`)}</p>
            <p className="text-lg font-bold">{t(`home.deals.${d.id}.title`)}</p>
            <p className="mt-1 text-sm text-white/90">{t(`home.deals.${d.id}.desc`)}</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-bold group-hover:gap-2">
              {t('home.deals.bookNow')}
              <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
