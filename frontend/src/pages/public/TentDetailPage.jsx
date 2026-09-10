import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Images, Wifi, Car, Coffee, Tent, Flame, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchTentBySlug, fetchReviews } from '../../services/listingsApi';
import ReviewScore from '../../components/property/ReviewScore';
import ListingReviewsSection from '../../components/property/ListingReviewsSection';
import TentGuestBookingForm from '../../components/booking/TentGuestBookingForm';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import Seo from '../../components/seo/Seo';
import { firstImageUrl, truncateMeta } from '../../constants/seo';
import { resolveMediaUrls } from '../../utils/mediaUrl';
import { formatCurrency } from '../../utils/format';
import { formatTime12 } from '../../utils/time12h';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200';
const amenityIcons = {
  WiFi: Wifi,
  'Free WiFi': Wifi,
  Parking: Car,
  'Free parking': Car,
  Breakfast: Coffee,
  Bonfire: Flame,
  Stargazing: Sparkles,
};

export default function TentDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setReviews([]);
    setLoading(true);
    fetchTentBySlug(slug)
      .then(async (data) => {
        setItem(data);
        if (data?._id) setReviews(await fetchReviews('TENT', data._id));
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    setShowBookingForm(false);
    setPhotoIndex(0);
    setTab('overview');
  }, [slug]);

  if (loading) {
    return (
      <div className="page-container py-8">
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (!item) {
    return <div className="page-container py-8">Not found</div>;
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'policies', label: 'Policies' },
  ];

  const images = item.images?.length ? resolveMediaUrls(item.images) : [FALLBACK_IMG];
  const fromPrice = item.pricePerNight;
  const locationLabel =
    (typeof item.location === 'string' && item.location) ||
    item.address?.city ||
    item.address?.line1 ||
    'Mahabaleshwar';

  const openBookingForm = () => {
    if (!isAuthenticated) return;
    setShowBookingForm(true);
    requestAnimationFrame(() => {
      document.getElementById('tent-guest-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="page-container py-8">
      <Seo
        title={item.name}
        description={truncateMeta(item.description || `${item.name} — tent stay in Mahabaleshwar.`)}
        image={firstImageUrl(item.images) || '/logo.png'}
        type="article"
      />

      <nav className="mb-4 text-sm text-primary">
        <Link to="/">Home</Link> &gt; <Link to="/tents">{t('nav.tents')}</Link> &gt;{' '}
        <span className="text-slate-600">{item.name}</span>
      </nav>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[340px_minmax(0,1fr)_240px]">
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

          <div className="flex flex-col gap-3 border-t border-slate-100 p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-primary sm:text-3xl">{item.name}</h1>
              <ReviewScore
                score={item.score || item.rating}
                label={item.scoreLabel}
                reviewCount={item.reviewCount}
                size="sm"
              />
            </div>
            <p className="flex items-start gap-1.5 text-sm text-slate-600">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
              {locationLabel}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-slate-600">
              <Tent size={16} className="text-primary" />
              Capacity {item.capacity || 2} · {item.totalTents || 1} tent{(item.totalTents || 1) > 1 ? 's' : ''}
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
          </div>

          <div className="flex flex-col justify-between gap-4 border-t border-slate-100 bg-slate-50/80 p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div className="text-right lg:text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">From</p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {fromPrice != null ? formatCurrency(fromPrice) : '—'}
              </p>
              <p className="text-xs text-slate-500">per night · incl. taxes at checkout</p>
            </div>
            {isAuthenticated ? (
              <div>
                <p className="mb-3 text-xs text-slate-500">
                  {showBookingForm
                    ? 'Complete the booking form below.'
                    : 'Open the tent guest booking form to continue.'}
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
                <p className="mb-3 text-xs text-slate-500">Sign in to book this tent stay.</p>
                <Link to="/login" className="btn-primary block w-full text-center">
                  Sign in to book
                </Link>
              </div>
            )}
          </div>
        </div>
      </article>

      <div className="mt-8">
        <div className="flex gap-6 border-b border-border">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => setTab(tabItem.id)}
              className={`pb-3 text-sm font-medium ${tab === tabItem.id ? 'tab-active' : 'text-slate-500'}`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="mt-6 max-w-3xl space-y-6">
            <p className="whitespace-pre-line leading-relaxed text-slate-700">
              {item.description || 'Premium glamping with valley views.'}
            </p>
            {item.amenities?.length > 0 && (
              <div>
                <h3 className="font-bold">Most popular facilities</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {item.amenities.map((a) => {
                    const Icon = amenityIcons[a] || Tent;
                    return (
                      <span key={a} className="flex items-center gap-2 text-sm">
                        <Icon size={18} className="text-primary" />
                        {a}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <ListingReviewsSection
            reviews={reviews}
            score={item.score || item.rating}
            label={item.scoreLabel}
            reviewCount={reviews.length || item.reviewCount}
          />
        )}

        {tab === 'policies' && (
          <div className="mt-6 max-w-3xl card space-y-4 p-6 text-sm text-slate-600">
            <p>
              <strong>Check-in:</strong> {formatTime12(item.checkInTime || '14:00')} · <strong>Check-out:</strong>{' '}
              {formatTime12(item.checkOutTime || '11:00')}
            </p>
            <p>
              {item.cancellationPolicyText ||
                item.cancellationPolicy ||
                'Free cancellation available on select rates. GST 12% applicable.'}
            </p>
          </div>
        )}
      </div>

      {isAuthenticated && showBookingForm && (
        <div id="tent-guest-form" className="mt-10 scroll-mt-24 border-t border-slate-100 pt-10">
          <TentGuestBookingForm item={item} openMode={false} />
        </div>
      )}
    </div>
  );
}
