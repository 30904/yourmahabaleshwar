import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { MapPin, Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchDriverBySlug } from '../../services/listingsApi';
import ReviewScore from '../../components/property/ReviewScore';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { dummyDrivers } from '../../data/dummyListings';
import { normalizeDriver } from '../../utils/listingHelpers';
import Seo from '../../components/seo/Seo';
import { truncateMeta } from '../../constants/seo';

export default function TaxiDetailPage() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const isTaxiRoute = pathname.startsWith('/taxi');
  const detailNs = isTaxiRoute ? 'taxiDetail' : 'driverDetail';
  const bookPath = isTaxiRoute ? '/taxi/book' : '/drivers/book';
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

  const priceFrom = item.perTripPrice ?? item.priceFrom;

  return (
    <div className="page-container py-8">
      <Seo
        title={item.name}
        description={truncateMeta(
          `${item.name} — ${item.vehicleType || (isTaxiRoute ? 'taxi' : 'driver')} in Mahabaleshwar. Book transfers & sightseeing.`
        )}
        image="/logo.png"
        type="article"
      />

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[340px_minmax(0,1fr)_240px]">
          <div className="relative min-h-[220px] bg-gradient-to-br from-primary to-blue-600 lg:min-h-[280px]">
            <div className="flex h-full min-h-[220px] items-center justify-center lg:min-h-[280px]">
              <Car size={72} className="text-white/80" />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-primary sm:text-3xl">{item.name}</h1>
              <ReviewScore score={item.score} label={item.scoreLabel} reviewCount={item.reviewCount} size="sm" />
            </div>
            <p className="flex items-start gap-1.5 text-sm text-slate-600">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
              {item.vehicleType || (isTaxiRoute ? 'Taxi' : 'Driver')} · Mahabaleshwar
            </p>
            {item.serviceArea && (
              <p className="text-sm text-slate-600">
                {t(`${detailNs}.serviceArea`)}: {item.serviceArea}
              </p>
            )}
            <p className="line-clamp-4 text-sm leading-relaxed text-slate-600">
              {t(`${detailNs}.description`)}
            </p>
            <div className="mt-auto grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
              <p>
                {t(`${detailNs}.perTrip`)}: {formatCurrency(item.perTripPrice)}
              </p>
              <p>
                {t(`${detailNs}.hourly`)}: {formatCurrency(item.hourlyRate)}/hr
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 border-t border-slate-100 bg-slate-50/80 p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div className="text-right lg:text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t(`${detailNs}.fromLabel`)}</p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {priceFrom != null ? formatCurrency(priceFrom) : '—'}
              </p>
              <p className="text-xs text-slate-500">{t(`${detailNs}.priceNote`)}</p>
            </div>
            {isAuthenticated ? (
              <div>
                <p className="mb-3 text-xs text-slate-500">{t('serviceBooking.openFormSubtitle')}</p>
                <Link to={bookPath} className="btn-primary block w-full text-center">
                  {t(`${detailNs}.bookNow`)}
                </Link>
              </div>
            ) : (
              <div>
                <p className="mb-3 text-xs text-slate-500">{t(`${detailNs}.signInHint`)}</p>
                <Link to="/login" className="btn-primary block w-full text-center">
                  {t(`${detailNs}.signInToBook`)}
                </Link>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
