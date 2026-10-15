import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HomeSectionHeader from './HomeSectionHeader';
import { fetchPublicHomepageDeals } from '../../services/listingsApi';

const TONE_CLASS = {
  blue: 'bg-gradient-to-br from-blue-600 to-blue-900',
  green: 'bg-gradient-to-br from-emerald-600 to-teal-800',
  orange: 'bg-gradient-to-br from-amber-500 to-orange-600',
};

const FALLBACK = [
  { id: 'monsoon', tone: 'blue', link: '/hotels' },
  { id: 'weekend', tone: 'green', link: '/hotels' },
  { id: 'earlyBird', tone: 'orange', link: '/hotels' },
];

function textFor(deal, field, language) {
  if (String(language || '').startsWith('mr') && deal[`${field}Mr`]) return deal[`${field}Mr`];
  return deal[field] || '';
}

export default function HomeDealsSection() {
  const { t, i18n } = useTranslation();
  const [deals, setDeals] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicHomepageDeals()
      .then((rows) => {
        if (!cancelled) setDeals(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setDeals(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = deals
    ? deals.map((deal) => ({
        key: deal._id,
        tone: deal.tone,
        link: deal.link || '/hotels',
        discount: textFor(deal, 'discount', i18n.language),
        title: textFor(deal, 'title', i18n.language),
        description: textFor(deal, 'description', i18n.language),
      }))
    : FALLBACK.map((deal) => ({
        key: deal.id,
        tone: deal.tone,
        link: deal.link,
        discount: t(`home.deals.${deal.id}.discount`),
        title: t(`home.deals.${deal.id}.title`),
        description: t(`home.deals.${deal.id}.desc`),
      }));

  return (
    <section className="page-container py-12 sm:py-16">
      <HomeSectionHeader
        eyebrow={t('home.deals.eyebrow')}
        title={t('home.deals.title')}
        subtitle={t('home.deals.subtitle')}
        linkTo="/hotels"
        linkLabel={t('home.deals.seeAll')}
      />
      {cards.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((deal) => (
            <Link
              key={deal.key}
              to={deal.link}
              className={`group flex min-h-[200px] flex-col overflow-hidden rounded-booking p-6 text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl sm:p-7 ${TONE_CLASS[deal.tone] || TONE_CLASS.blue}`}
            >
              <Sparkles size={22} className="opacity-90" />
              <p className="mt-3 text-3xl font-extrabold tracking-tight">{deal.discount}</p>
              <p className="text-lg font-bold">{deal.title}</p>
              <p className="mt-1 text-sm text-white/90">{deal.description}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-bold group-hover:gap-2">
                {t('home.deals.bookNow')}
                <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
