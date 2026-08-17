import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { fetchGuideBySlug } from '../../services/listingsApi';
import ReviewScore from '../../components/property/ReviewScore';
import ServiceBookingForm from '../../components/booking/ServiceBookingForm';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { dummyGuides } from '../../data/dummyListings';
import { normalizeGuide } from '../../utils/listingHelpers';
import Seo from '../../components/seo/Seo';
import { truncateMeta } from '../../constants/seo';

export default function GuideDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuideBySlug(slug)
      .then(setItem)
      .catch(() => setItem(normalizeGuide(dummyGuides.find((x) => x.slug === slug) || dummyGuides[0])))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="page-container py-10"><Skeleton className="h-96" /></div>;
  if (!item) return <div className="page-container py-10">Not found</div>;

  return (
    <div className="page-container py-8">
      <Seo
        title={item.name}
        description={truncateMeta(item.bio || item.description || `${item.name} — local guide in Mahabaleshwar.`)}
        image="/logo.png"
        type="article"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900" alt={item.name} className="aspect-video w-full rounded-2xl object-cover" />
          <h1 className="mt-6 text-3xl font-bold">{item.name}</h1>
          <ReviewScore score={item.score} label={item.scoreLabel} reviewCount={item.reviewCount} className="mt-2" />
          <p className="mt-2 flex items-center gap-1 text-slate-500"><MapPin size={16} /> Mahabaleshwar</p>
          <p className="mt-4 text-slate-600">{item.bio || item.description}</p>
          <p className="mt-2 text-sm text-slate-500">Languages: {(item.languages || []).join(', ')}</p>
          <p className="text-sm text-slate-500">Specialties: {(item.specialties || []).join(', ')}</p>
        </div>
        {isAuthenticated ? (
          <ServiceBookingForm type="guide" item={item} />
        ) : (
          <div className="card h-fit p-6">
            <p className="text-2xl font-bold text-primary">From {formatCurrency(item.package6hr)}</p>
            <Link to="/login" className="mt-4 block"><Button className="w-full">Sign in to book</Button></Link>
          </div>
        )}
      </div>
    </div>
  );
}
