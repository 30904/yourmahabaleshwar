import HomeHero from '../../components/home/HomeHero';
import HomeCategoryStrip from '../../components/home/HomeCategoryStrip';
import HomeDealsSection from '../../components/home/HomeDealsSection';
import HomePropertyTabs from '../../components/home/HomePropertyTabs';
import HomePromoBanner from '../../components/home/HomePromoBanner';
import HomeDestinations from '../../components/home/HomeDestinations';
import HomeServices from '../../components/home/HomeServices';
import HomeWhyBook from '../../components/home/HomeWhyBook';

export default function HomePage() {
  return (
    <div className="home-page">
      <HomeHero />
      <HomeCategoryStrip />
      <HomeDealsSection />
      <HomePropertyTabs />
      <HomePromoBanner />
      <HomeDestinations />
      <HomeServices />
      <HomeWhyBook />
    </div>
  );
}
