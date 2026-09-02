import { useTranslation } from 'react-i18next';
import TrustBadges from '../common/TrustBadges';
import HomeSectionHeader from './HomeSectionHeader';

export default function HomeWhyBook() {
  const { t } = useTranslation();

  return (
    <section className="home-why-section py-12 sm:py-16">
      <div className="page-container">
        <HomeSectionHeader
          eyebrow={t('home.whyBook.eyebrow')}
          title={t('home.whyBook.title')}
          subtitle={t('home.whyBook.subtitle')}
        />
        <div className="mt-8">
          <TrustBadges />
        </div>
      </div>
    </section>
  );
}
