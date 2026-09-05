import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Images } from 'lucide-react';
import { fetchGuideBySlug } from '../../services/listingsApi';
import ReviewScore from '../../components/property/ReviewScore';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { dummyGuides } from '../../data/dummyListings';
import { normalizeGuide } from '../../utils/listingHelpers';
import Seo from '../../components/seo/Seo';
import { firstImageUrl, truncateMeta } from '../../constants/seo';
import { resolveMediaUrls } from '../../utils/mediaUrl';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900';

export default function GuideDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    fetchGuideBySlug(slug)
      .then(setItem)
      .catch(() => setItem(normalizeGuide(dummyGuides.find((x) => x.slug === slug) || dummyGuides[0])))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    setPhotoIndex(0);
  }, [slug]);

  if (loading) return <div className="page-container py-8"><Skeleton className="h-96" /></div>;
  if (!item) return <div className="page-container py-8">Not found</div>;

  const images = item.images?.length ? resolveMediaUrls(item.images) : [FALLBACK_IMG];
  const priceFrom = item.package6hr ?? item.priceFrom;

  const bookPath = '/guides/book';

  return (
    <div className="page-container py-8">
      <Seo
        title={item.name}
        description={truncateMeta(item.bio || item.description || `${item.name} — local guide in Mahabaleshwar.`)}
        image={firstImageUrl(item.images) || '/logo.png'}
        type="article"
      />

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
              <ReviewScore score={item.score} label={item.scoreLabel} reviewCount={item.reviewCount} size="sm" />
            </div>
            <p className="flex items-start gap-1.5 text-sm text-slate-600">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
              Mahabaleshwar
            </p>
            {(item.languages || []).length > 0 && (
              <p className="text-sm text-slate-600">
                Languages: {(item.languages || []).join(', ')}
              </p>
            )}
            {(item.specialties || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(item.specialties || []).slice(0, 6).map((s) => (
                  <span key={s} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-primary">
                    {s}
                  </span>
                ))}
              </div>
            )}
            {(item.bio || item.description) && (
              <p className="line-clamp-4 text-sm leading-relaxed text-slate-600">{item.bio || item.description}</p>
            )}
            <div className="mt-auto grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
              <p>6 hr: {formatCurrency(item.package6hr)}</p>
              <p>12 hr: {formatCurrency(item.package12hr)}</p>
              {item.bikeAddonPrice != null && <p>Bike add-on: +{formatCurrency(item.bikeAddonPrice)}</p>}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 border-t border-slate-100 bg-slate-50/80 p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div className="text-right lg:text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">From</p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {priceFrom != null ? formatCurrency(priceFrom) : '—'}
              </p>
              <p className="text-xs text-slate-500">6 hr package · incl. taxes at checkout</p>
            </div>
            {isAuthenticated ? (
              <div>
                <p className="mb-3 text-xs text-slate-500">
                  Submit a request — our team will assign the best available guide.
                </p>
                <Link to={bookPath} className="btn-primary block w-full text-center">
                  Book Now
                </Link>
              </div>
            ) : (
              <div>
                <p className="mb-3 text-xs text-slate-500">Sign in to book this guide.</p>
                <Link to="/login" className="btn-primary block w-full text-center">
                  Sign in to book
                </Link>
              </div>
            )}
          </div>
        </div>
      </article>

      {(item.bio || item.description) && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-900">About this guide</h2>
          <p className="mt-2 whitespace-pre-line text-slate-700">{item.bio || item.description}</p>
        </section>
      )}

    </div>
  );
}
