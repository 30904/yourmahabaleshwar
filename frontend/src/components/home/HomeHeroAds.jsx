import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Megaphone, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchHomepageHeroAds, trackHomepageAdEvent } from '../../services/homepageAdsApi';
import { getMediaUrl } from '../../utils/mediaUrl';
import { formatCurrency } from '../../utils/format';

export default function HomeHeroAds() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    fetchHomepageHeroAds()
      .then((ads) => {
        if (!alive) return;
        setItems(ads.slice(0, 3));
        ads.slice(0, 3).forEach((ad) => {
          if (ad.adId) trackHomepageAdEvent(ad.adId, 'impression');
        });
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!items.length) return null;

  return (
    <aside className="home-hero-ads" aria-label={t('home.sponsoredListings')}>
      <p className="home-hero-ads-label">
        <Megaphone size={12} />
        {t('home.sponsoredListings')}
      </p>
      <div className="home-hero-ads-stack">
        {items.map((ad) => (
          <Link
            key={ad.adId}
            to={ad.href}
            className="home-hero-ad-card"
            onClick={() => ad.adId && trackHomepageAdEvent(ad.adId, 'click')}
          >
            <div className="home-hero-ad-media">
              {ad.image ? (
                <img src={getMediaUrl(ad.image)} alt="" loading="lazy" />
              ) : (
                <div className="home-hero-ad-fallback" />
              )}
            </div>
            <div className="home-hero-ad-body">
              <p className="home-hero-ad-type">{ad.listingType}</p>
              <p className="home-hero-ad-name">{ad.name}</p>
              <p className="home-hero-ad-meta">
                <MapPin size={11} />
                <span>{typeof ad.location === 'string' ? ad.location : ad.location?.city || 'Mahabaleshwar'}</span>
                {ad.rating != null && Number.isFinite(Number(ad.rating)) && (
                  <>
                    <Star size={11} className="fill-amber-300 text-amber-300" />
                    <span>{Number(ad.rating).toFixed(1)}</span>
                  </>
                )}
              </p>
              {ad.priceFrom != null && (
                <p className="home-hero-ad-price">
                  {t('home.fromPrice', { price: formatCurrency(ad.priceFrom) })}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
