import TrustBadges from '../common/TrustBadges';
import HomeSectionHeader from './HomeSectionHeader';

export default function HomeWhyBook() {
  return (
    <section className="home-why-section py-12 sm:py-16">
      <div className="page-container">
        <HomeSectionHeader
          eyebrow="Why us"
          title="Book with confidence"
          subtitle="The same trust you expect from global booking platforms — built for Mahabaleshwar"
        />
        <div className="mt-8">
          <TrustBadges />
        </div>
      </div>
    </section>
  );
}
