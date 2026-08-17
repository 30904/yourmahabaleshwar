import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { deals } from '../../data/dummyListings';
import HomeSectionHeader from './HomeSectionHeader';

export default function HomeDealsSection() {
  return (
    <section className="page-container py-12 sm:py-16">
      <HomeSectionHeader
        eyebrow="Limited time"
        title="Trending deals & offers"
        subtitle="Save more on your next hill-station escape"
        linkTo="/hotels"
        linkLabel="See all deals"
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map((d) => (
          <Link
            key={d.title}
            to="/hotels"
            className={`group flex min-h-[200px] flex-col overflow-hidden rounded-booking p-6 text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl sm:p-7 ${d.gradient}`}
          >
            <Sparkles size={22} className="opacity-90" />
            <p className="mt-3 text-3xl font-extrabold tracking-tight">{d.discount}</p>
            <p className="text-lg font-bold">{d.title}</p>
            <p className="mt-1 text-sm text-white/90">{d.desc}</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-bold group-hover:gap-2">
              Book now
              <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
