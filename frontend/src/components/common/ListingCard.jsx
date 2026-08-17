import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import Badge from '../ui/Badge';
import { formatCurrency } from '../../utils/format';

export default function ListingCard({ item, type, linkPrefix }) {
  const image = item.images?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600';
  const price =
    item.priceFrom ||
    item.pricePerNight ||
    item.package6hr ||
    item.perTripPrice ||
    item.basePrice;

  return (
    <Link to={`${linkPrefix}/${item.slug || item._id}`} className="card group overflow-hidden p-0 transition hover:shadow-soft">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {item.isFeatured && (
          <Badge className="absolute left-3 top-3" color="warning">
            Featured
          </Badge>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 line-clamp-1">{item.name}</h3>
          {item.rating && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-slate-700">
              <Star size={14} className="fill-accent text-accent" />
              {Number(item.rating).toFixed(1)}
            </span>
          )}
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <MapPin size={14} />
          {item.address?.city || item.location || 'Mahabaleshwar'}
        </p>
        {price != null && price !== '' && (
          <p className="mt-3 text-lg font-bold text-primary">
            {formatCurrency(price)}
            <span className="text-sm font-normal text-slate-500">
              {type === 'guide' ? '/6hr' : type === 'taxi' ? '/trip' : '/night'}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}
