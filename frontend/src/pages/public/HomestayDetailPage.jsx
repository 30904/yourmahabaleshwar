import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Images } from 'lucide-react';
import { fetchHomestayBySlug, fetchReviews } from '../../services/listingsApi';
import ReviewScore from '../../components/property/ReviewScore';
import HomestayGuestBookingForm from '../../components/booking/HomestayGuestBookingForm';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import Seo from '../../components/seo/Seo';
import { firstImageUrl, truncateMeta } from '../../constants/seo';
import { formatCurrency } from '../../utils/format';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200';

export default function HomestayDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    fetchHomestayBySlug(slug)
      .then(async (data) => {
        setItem(data);
        if (data?._id) setReviews(await fetchReviews('HOMESTAY', data._id));
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    setShowBookingForm(false);
    setPhotoIndex(0);
  }, [slug]);

  if (loading) return <div className="page-container py-8"><Skeleton className="h-96" /></div>;
  if (!item) return <div className="page-container py-8">Not found</div>;

  const images = item.images?.length ? item.images : [FALLBACK_IMG];
  const locationLabel =
    [item.address?.line1, item.address?.city || item.location, item.address?.state]
      .filter(Boolean)
      .join(', ') || 'Mahabaleshwar';

  const openBookingForm = () => {
    if (!isAuthenticated) return;
    setShowBookingForm(true);
    requestAnimationFrame(() => {
      document.getElementById('homestay-guest-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="page-container py-8">
      <Seo
        title={item.name}
        description={truncateMeta(item.description || `${item.name} — homestay in Mahabaleshwar.`)}
        image={firstImageUrl(item.images) || '/logo.png'}
        type="article"
      />

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[340px_minmax(0,1fr)_240px]">
          {/* Image */}
          <div className="relative min-h-[220px] bg-slate-100 lg:min-h-[280px]">
            <img
              src={images[photoIndex] || images[0]}
              alt={item.name}
              className="h-full w-full object-cover lg:absolute lg:inset-0"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-sm font-bold shadow"
                  onClick={() => setPhotoIndex((i) => (i - 1 + images.length) % images.length)}
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-sm font-bold shadow"
                  onClick={() => setPhotoIndex((i) => (i + 1) % images.length)}
                  aria-label="Next photo"
                >
                  ›
                </button>
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-semibold text-white">
                  <Images size={12} />
                  {photoIndex + 1}/{images.length}
                </span>
              </>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-3 border-t border-slate-100 p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-primary sm:text-3xl">{item.name}</h1>
              <ReviewScore score={item.score || item.rating} label={item.scoreLabel} reviewCount={item.reviewCount} size="sm" />
            </div>
            <p className="flex items-start gap-1.5 text-sm text-slate-600">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
              {locationLabel}
            </p>
            {item.amenities?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.amenities.slice(0, 6).map((a) => (
                  <span key={a} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-primary">
                    {a}
                  </span>
                ))}
              </div>
            )}
            {item.description && (
              <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
            )}
            {(item.rooms || []).length > 0 && (
              <p className="mt-auto text-xs font-medium text-slate-500">
                {(item.rooms || []).length} room type{(item.rooms || []).length > 1 ? 's' : ''} available
              </p>
            )}
          </div>

          {/* Price / Book */}
          <div className="flex flex-col justify-between gap-4 border-t border-slate-100 bg-slate-50/80 p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div className="text-right lg:text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">From</p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {item.priceFrom != null ? formatCurrency(item.priceFrom) : '—'}
              </p>
              <p className="text-xs text-slate-500">per night · incl. taxes at checkout</p>
            </div>
            {isAuthenticated ? (
              <div>
                <p className="mb-3 text-xs text-slate-500">
                  {showBookingForm
                    ? 'Complete the booking form below.'
                    : 'Open the guest booking form to continue.'}
                </p>
                {!showBookingForm ? (
                  <button type="button" className="btn-primary w-full" onClick={openBookingForm}>
                    Book Now
                  </button>
                ) : (
                  <button type="button" className="btn-outline w-full" onClick={() => setShowBookingForm(false)}>
                    Hide booking form
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p className="mb-3 text-xs text-slate-500">Sign in to book this homestay.</p>
                <Link to="/login" className="btn-primary block w-full text-center">
                  Sign in to book
                </Link>
              </div>
            )}
          </div>
        </div>
      </article>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          {item.description && (
            <section>
              <h2 className="text-lg font-bold text-slate-900">About this homestay</h2>
              <p className="mt-2 whitespace-pre-line text-slate-700">{item.description}</p>
            </section>
          )}
          {item.houseRules?.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-900">House rules</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {item.houseRules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
          )}
          {(item.rooms || []).length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-900">Rooms</h2>
              <div className="mt-3 space-y-2">
                {(item.rooms || []).map((room) => (
                  <div key={room._id || room.name} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{room.name}</p>
                      <p className="text-xs text-slate-500">
                        Up to {room.capacity || 2} guests
                        {room.totalRooms ? ` · ${room.totalRooms} available` : ''}
                      </p>
                    </div>
                    <p className="font-bold text-primary">{formatCurrency(room.basePrice)} / night</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {reviews.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-900">Guest reviews</h2>
              <div className="mt-3 space-y-3">
                {reviews.map((r) => (
                  <div key={r._id} className="rounded-xl border border-slate-100 p-4">
                    <p className="font-medium">{r.user?.name} · {r.rating}/5</p>
                    <p className="mt-1 text-sm text-slate-600">{r.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {isAuthenticated && showBookingForm && (
        <div id="homestay-guest-form" className="mt-10 scroll-mt-24 border-t border-slate-100 pt-10">
          <HomestayGuestBookingForm item={item} />
        </div>
      )}
    </div>
  );
}
