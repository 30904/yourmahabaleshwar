import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Images } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchHorseBySlug, fetchReviews } from '../../services/listingsApi';
import ListingReviewsSection from '../../components/property/ListingReviewsSection';
import ReviewScore from '../../components/property/ReviewScore';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import Seo from '../../components/seo/Seo';
import { firstImageUrl, truncateMeta } from '../../constants/seo';
import { resolveMediaUrls } from '../../utils/mediaUrl';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5f?w=900';

export default function HorseDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    fetchHorseBySlug(slug)
      .then(async (data) => {
        setItem(data);
        if (data?._id) setReviews(await fetchReviews('HORSE', data._id));
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    setPhotoIndex(0);
  }, [slug]);

  if (loading) return <div className="page-container py-8"><Skeleton className="h-96" /></div>;
  if (!item) return <div className="page-container py-8">Not found</div>;

  const images = item.images?.length ? resolveMediaUrls(item.images) : [FALLBACK_IMG];
  const priceFrom = item.priceFrom ?? item.routes?.[0]?.price;
  const description = item.description || item.horseDetails;

  return (
    <div className="page-container py-8">
      <Seo
        title={item.name}
        description={truncateMeta(description || `${item.name} — horse ride in Mahabaleshwar.`)}
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
              {item.location || 'Mahabaleshwar'}
            </p>
            {item.stable?.serviceArea && (
              <p className="text-sm text-slate-600">
                {t('horseGuestBooking.serviceArea')}: {item.stable.serviceArea}
              </p>
            )}
            {item.stable?.safetyGearProvided && (
              <span className="w-fit rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-primary">
                {t('horseGuestBooking.safetyGearProvided')}
              </span>
            )}
            {description && (
              <p className="line-clamp-4 text-sm leading-relaxed text-slate-600">{description}</p>
            )}
            <div className="mt-auto grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
              {(item.routes || []).slice(0, 4).map((r) => (
                <p key={r._id || r.name}>
                  {r.name}: {formatCurrency(r.price)}
                </p>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 border-t border-slate-100 bg-slate-50/80 p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div className="text-right lg:text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('horseGuestBooking.fromLabel')}
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {priceFrom != null ? formatCurrency(priceFrom) : '—'}
              </p>
              <p className="text-xs text-slate-500">{t('horseGuestBooking.perRouteHint')}</p>
            </div>
            {isAuthenticated ? (
              <div>
                <p className="mb-3 text-xs text-slate-500">{t('serviceBooking.openFormSubtitle')}</p>
                <Link to="/horses/book" className="btn-primary block w-full text-center">
                  {t('horseGuestBooking.bookNow')}
                </Link>
              </div>
            ) : (
              <div>
                <p className="mb-3 text-xs text-slate-500">{t('horseGuestBooking.signInHint')}</p>
                <Link to="/login" className="btn-primary block w-full text-center">
                  {t('horseGuestBooking.signInToBook')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </article>

      {description && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-900">{t('horseGuestBooking.aboutTitle')}</h2>
          <p className="mt-2 whitespace-pre-line text-slate-700">{description}</p>
        </section>
      )}

      {(item.routes || []).length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-900">{t('horseGuestBooking.routesTitle')}</h2>
          <div className="mt-3 space-y-2">
            {(item.routes || []).map((r) => (
              <div key={r._id || r.name} className="flex justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm shadow-sm">
                <span>
                  {r.name} · {r.durationMinutes} {t('horseGuestBooking.minutes')}
                </span>
                <span className="font-semibold text-primary">{formatCurrency(r.price)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <ListingReviewsSection
          reviews={reviews}
          score={item.score || item.rating}
          label={item.scoreLabel}
          reviewCount={reviews.length || item.reviewCount}
          className="mt-8"
          scoreSize="md"
        />
      )}

    </div>
  );
}
