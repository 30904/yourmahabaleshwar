import { Link } from 'react-router-dom';
import { MapPin, Heart, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ReviewScore from './ReviewScore';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { addToWishlist, removeFromWishlist } from '../../services/userApi';

export default function PropertyCard({
  item,
  linkPrefix,
  priceKey = 'priceFrom',
  priceSuffix,
  itemType = 'HOTEL',
}) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const resolvedPriceSuffix = priceSuffix ?? t('property.perNight');
  const [saved, setSaved] = useState(false);
  const image = item.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
  const price = item[priceKey] || item.pricePerNight || item.package6hr || item.perTripPrice;
  const original = item.originalPrice;

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error(t('property.signInFavorites'));
      return;
    }
    try {
      if (saved) {
        await removeFromWishlist(item._id, itemType);
        setSaved(false);
        toast.success(t('property.removedFavorites'));
      } else {
        await addToWishlist(item._id, itemType);
        setSaved(true);
        toast.success(t('property.savedFavorites'));
      }
    } catch {
      toast.error(t('property.favoritesError'));
    }
  };

  return (
    <article className="property-card">
      <Link to={`${linkPrefix}/${item.slug || item._id}`} className="relative block w-full shrink-0 sm:w-[280px] lg:w-[300px]">
        <img src={image} alt={item.name} className="h-full min-h-[200px] w-full object-cover sm:min-h-[220px]" loading="lazy" />
        <button type="button" className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow hover:bg-white" onClick={toggleWishlist} aria-label={t('property.saveAria')}>
          <Heart size={18} className={saved ? 'fill-red-500 text-red-500' : 'text-slate-600'} />
        </button>
        {item.isFeatured && <span className="absolute left-0 top-3 bg-primary px-2 py-1 text-xs font-bold text-white">{t('property.featured')}</span>}
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link to={`${linkPrefix}/${item.slug || item._id}`}><h3 className="text-lg font-bold text-primary hover:underline">{item.name}</h3></Link>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} />{item.distance || item.address?.city || item.location || 'Mahabaleshwar'}</p>
          </div>
          <ReviewScore score={item.score || item.rating} label={item.scoreLabel} reviewCount={item.reviewCount} size="sm" />
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {item.freeCancellation && <span className="flex items-center gap-1 text-xs font-medium text-secondary"><Check size={14} /> {t('property.freeCancellation')}</span>}
          {item.payAtProperty && <span className="text-xs text-slate-500">{t('property.noPrepayment')}</span>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <div className="text-left sm:text-right">
            {original && <p className="text-sm text-slate-400 line-through">{formatCurrency(original)}</p>}
            <p className="text-xl font-bold text-slate-900">{formatCurrency(price)}</p>
            <p className="text-xs text-slate-500">{resolvedPriceSuffix} · {t('property.inclTaxes')}</p>
          </div>
          <Link to={`${linkPrefix}/${item.slug || item._id}`} className="btn-secondary shrink-0 px-4 py-2.5 text-sm">{t('property.seeAvailability')}</Link>
        </div>
      </div>
    </article>
  );
}
