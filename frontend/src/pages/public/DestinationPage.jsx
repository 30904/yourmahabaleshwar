import { Link, useParams } from 'react-router-dom';
import { MapPin, Sparkles, Star, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/seo/Seo';
import { destinationBySlug, destinationCopy } from '../../data/destinations';

const blocks = [
  { key: 'special', titleKey: 'home.destinations.special', icon: Star },
  { key: 'exciting', titleKey: 'home.destinations.exciting', icon: Sparkles },
];

export default function DestinationPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const place = destinationBySlug(slug);

  if (!place) {
    return (
      <div className="page-container py-16">
        <Seo title={t('home.destinations.title')} description={t('home.destinations.notFound')} noIndex />
        <p className="text-slate-600">{t('home.destinations.notFound')}</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-primary">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  const copy = destinationCopy(place, i18n.language);

  return (
    <div className="bg-background pb-16">
      <Seo title={copy.name} description={copy.intro} image={place.hero} />
      <div className="relative h-72 overflow-hidden sm:h-[420px]">
        <img src={place.hero} alt={copy.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="page-container pb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
              {t('home.destinations.eyebrow')}
            </p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold text-white sm:text-5xl">
              <MapPin size={28} className="shrink-0" />
              {copy.name}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-white/90 sm:text-lg">{copy.intro}</p>
          </div>
        </div>
      </div>

      <div className="page-container space-y-8 py-10">
        <section className="rounded-2xl border border-border bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900">{t('home.destinations.aboutPlace')}</h2>
          <p className="mt-3 text-slate-600 leading-relaxed">{copy.about}</p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {blocks.map(({ key, titleKey, icon: Icon }) => (
            <section key={key} className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <Icon size={22} className="text-primary" />
                {t(titleKey)}
              </h2>
              <ul className="mt-4 space-y-3">
                {copy[key].map((item) => (
                  <li key={item} className="flex gap-3 text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="rounded-2xl border border-border bg-white p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Compass size={22} className="text-primary" />
            {t('home.destinations.activities')}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {copy.activities.map((item) => (
              <div key={item} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
