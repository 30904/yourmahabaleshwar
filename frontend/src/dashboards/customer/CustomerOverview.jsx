import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Heart, MapPin } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import PropertyCard from '../../components/property/PropertyCard';
import Skeleton from '../../components/ui/Skeleton';
import { fetchMyBookings } from '../../services/bookingsApi';
import { fetchHotels } from '../../services/listingsApi';
import { dummyHotels } from '../../data/dummyListings';

export default function CustomerOverview() {
  const [bookings, setBookings] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchMyBookings().catch(() => []),
      fetchHotels({ featured: 'true', limit: 2 }).catch(() => dummyHotels.slice(0, 2)),
    ]).then(([b, h]) => {
      setBookings(b);
      setFeatured(h);
    }).finally(() => setLoading(false));
  }, []);

  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Calendar} label="Total bookings" value={String(bookings.length)} color="primary" />
        <StatCard icon={MapPin} label="Confirmed" value={String(confirmed)} color="primary" />
        <StatCard icon={Heart} label="Saved" value="0" color="primary" />
      </div>
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Recommended for you</h3>
          <Link to="/hotels" className="text-sm font-semibold text-primary">View all</Link>
        </div>
        <div className="mt-4 space-y-4">
          {loading ? <Skeleton className="h-52" /> : featured.map((h) => <PropertyCard key={h._id} item={h} linkPrefix="/hotels" />)}
        </div>
      </div>
    </div>
  );
}
