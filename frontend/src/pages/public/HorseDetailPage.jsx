import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchHorseBySlug, fetchReviews } from '../../services/listingsApi';
import ImageGallery from '../../components/property/ImageGallery';
import ReviewScore from '../../components/property/ReviewScore';
import ServiceBookingForm from '../../components/booking/ServiceBookingForm';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import Seo from '../../components/seo/Seo';
import { firstImageUrl, truncateMeta } from '../../constants/seo';

export default function HorseDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHorseBySlug(slug)
      .then(async (data) => {
        setItem(data);
        if (data?._id) setReviews(await fetchReviews('HORSE', data._id));
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="page-container py-8"><Skeleton className="h-96" /></div>;
  if (!item) return <div className="page-container py-8">Not found</div>;

  return (
    <div className="page-container py-8">
      <Seo
        title={item.name}
        description={truncateMeta(item.description || item.horseDetails || `${item.name} — horse ride in Mahabaleshwar.`)}
        image={firstImageUrl(item.images) || '/logo.png'}
        type="article"
      />
      <h1 className="text-3xl font-bold">{item.name}</h1>
      <ReviewScore score={item.score} label={item.scoreLabel} reviewCount={item.reviewCount} className="mt-2" />
      <div className="mt-6"><ImageGallery images={item.images} name={item.name} /></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-slate-700">{item.description || item.horseDetails}</p>
          <div className="mt-6 space-y-2">
            <h3 className="font-semibold">Routes</h3>
            {(item.routes || []).map((r) => (
              <div key={r._id || r.name} className="flex justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                <span>{r.name} · {r.durationMinutes} min</span>
                <span className="font-semibold">{formatCurrency(r.price)}</span>
              </div>
            ))}
          </div>
          {reviews.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold">Reviews</h3>
              <div className="mt-3 space-y-3">
                {reviews.map((r) => (
                  <div key={r._id} className="rounded-xl border border-slate-100 p-4">
                    <p className="font-medium">{r.user?.name} · {r.rating}/5</p>
                    <p className="mt-1 text-sm text-slate-600">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {isAuthenticated ? (
          <ServiceBookingForm type="horse" item={item} />
        ) : (
          <Link to="/login" className="btn-primary h-fit text-center">Sign in to book</Link>
        )}
      </div>
    </div>
  );
}
