import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchTentBySlug } from '../../services/listingsApi';
import ImageGallery from '../../components/property/ImageGallery';
import ReviewScore from '../../components/property/ReviewScore';
import StickyReservation from '../../components/property/StickyReservation';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { dummyTents } from '../../data/dummyListings';
import { normalizeTent } from '../../utils/listingHelpers';
import Seo from '../../components/seo/Seo';
import { firstImageUrl, truncateMeta } from '../../constants/seo';

export default function TentDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTentBySlug(slug)
      .then(setItem)
      .catch(() => setItem(normalizeTent(dummyTents.find((tent) => tent.slug === slug) || dummyTents[0])))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="page-container py-8"><Skeleton className="h-96" /></div>;
  if (!item) return <div className="page-container py-8">Not found</div>;

  return (
    <div className="page-container py-8">
      <Seo
        title={item.name}
        description={truncateMeta(item.description || `${item.name} — tent stay in Mahabaleshwar.`)}
        image={firstImageUrl(item.images) || '/logo.png'}
        type="article"
      />
      <h1 className="text-3xl font-bold">{item.name}</h1>
      <ReviewScore score={item.score} label={item.scoreLabel} reviewCount={item.reviewCount} className="mt-2" />
      <div className="mt-6"><ImageGallery images={item.images} name={item.name} /></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <p className="text-slate-700">{item.description || 'Premium glamping with valley views.'}</p>
        <div>
          <StickyReservation property={item} pricePerNight={item.pricePerNight} />
          {isAuthenticated ? (
            <>
              <p className="mt-4 text-sm text-slate-600">{t('serviceBooking.openFormSubtitle')}</p>
              <Link to="/tents/book" className="btn-primary mt-4 block text-center">
                {t('serviceBooking.bookNow')}
              </Link>
            </>
          ) : (
            <Link to="/login" className="btn-primary mt-4 block text-center">Sign in to book</Link>
          )}
        </div>
      </div>
    </div>
  );
}
