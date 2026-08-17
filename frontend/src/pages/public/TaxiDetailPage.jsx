import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Car } from 'lucide-react';
import { fetchDriverBySlug } from '../../services/listingsApi';
import ReviewScore from '../../components/property/ReviewScore';
import ServiceBookingForm from '../../components/booking/ServiceBookingForm';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { dummyDrivers } from '../../data/dummyListings';
import { normalizeDriver } from '../../utils/listingHelpers';
import Seo from '../../components/seo/Seo';
import { truncateMeta } from '../../constants/seo';

export default function TaxiDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriverBySlug(slug)
      .then(setItem)
      .catch(() => setItem(normalizeDriver(dummyDrivers.find((x) => x.slug === slug) || dummyDrivers[0])))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="page-container py-10"><Skeleton className="h-96" /></div>;
  if (!item) return <div className="page-container py-10">Not found</div>;

  return (
    <div className="page-container py-8">
      <Seo
        title={item.name}
        description={truncateMeta(`${item.name} — ${item.vehicleType || 'taxi'} driver in Mahabaleshwar. Book transfers & sightseeing.`)}
        image="/logo.png"
        type="article"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600">
            <Car size={64} className="text-white/80" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">{item.name}</h1>
          <ReviewScore score={item.score} label={item.scoreLabel} reviewCount={item.reviewCount} className="mt-2" />
          <p className="mt-2 flex items-center gap-1 text-slate-500">
            <MapPin size={16} /> {item.vehicleType} · Mahabaleshwar
          </p>
          <p className="mt-4 text-slate-600">Reliable local driver for sightseeing and transfers.</p>
        </div>
        {isAuthenticated ? (
          <ServiceBookingForm type="taxi" item={item} />
        ) : (
          <div className="card h-fit p-6">
            <p className="text-2xl font-bold text-primary">From {formatCurrency(item.perTripPrice)}</p>
            <Link to="/login" className="mt-4 block"><Button className="w-full">Sign in to book</Button></Link>
          </div>
        )}
      </div>
    </div>
  );
}
