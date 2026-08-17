import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { popularDestinations } from '../../data/dummyListings';
import HomeSectionHeader from './HomeSectionHeader';

export default function HomeDestinations() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="page-container">
        <HomeSectionHeader
          eyebrow="Explore"
          title="Destinations near Mahabaleshwar"
          subtitle="From misty valleys to heritage forts"
          linkTo="/hotels"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularDestinations.map((d) => (
            <Link key={d.name} to="/hotels" className="home-destination-card group">
              <img src={d.image} alt={d.name} className="home-destination-img" loading="lazy" />
              <div className="home-destination-overlay" />
              <div className="home-destination-content">
                <p className="flex items-center gap-1 text-lg font-bold text-white">
                  <MapPin size={16} />
                  {d.name}
                </p>
                <p className="text-sm text-white/90">{d.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
