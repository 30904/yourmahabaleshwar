import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HomePromoBanner() {
  const { t } = useTranslation();

  return (
    <section className="page-container py-4">
      <div className="home-promo-banner">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-400/20">
              <Gift size={24} className="text-amber-300" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-200">{t('home.promo.eyebrow')}</p>
              <h3 className="text-lg font-bold text-white sm:text-xl">{t('home.promo.title')}</h3>
              <p className="mt-1 text-sm text-blue-100">{t('home.promo.subtitle')}</p>
            </div>
          </div>
          <Link to="/register-vendor" className="home-promo-btn shrink-0">
            {t('home.promo.cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
