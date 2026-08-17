import { MapPin, Star, Wifi } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { getMediaUrl } from '../../../utils/mediaUrl';

export default function PropertyListingPreview({ data, images, coverIndex, selectedAmenities }) {
  const cover = getMediaUrl(images[coverIndex] || images[0]);
  const city = data.address?.city || 'Mahabaleshwar';
  const minPrice = data.rooms?.length
    ? Math.min(...data.rooms.map((r) => Number(r.basePrice) || 0).filter(Boolean))
    : 0;

  return (
    <div className="admin-listing-preview">
      <p className="admin-listing-preview-label">Live listing preview</p>
      <article className="admin-listing-preview-card">
        <div className="admin-listing-preview-image">
          {cover ? (
            <img src={cover} alt="" />
          ) : (
            <div className="admin-listing-preview-placeholder">Add photos</div>
          )}
          {data.isFeatured && <span className="admin-listing-preview-badge">Featured</span>}
        </div>
        <div className="admin-listing-preview-body">
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 font-bold text-slate-900">{data.name || 'Property name'}</h4>
            {data.rating > 0 && (
              <span className="admin-listing-preview-rating">
                {Number(data.rating).toFixed(1)}
                <Star size={12} fill="currentColor" className="inline" />
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={12} />
            {city}, {data.address?.state || 'Maharashtra'}
          </p>
          <p className="mt-2 line-clamp-2 text-xs text-slate-600">
            {data.shortDescription || data.description?.slice(0, 120) || 'Add a compelling description for guests.'}
          </p>
          {selectedAmenities?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {selectedAmenities.slice(0, 4).map((a) => (
                <span key={a} className="admin-listing-preview-amenity">
                  <Wifi size={10} /> {a}
                </span>
              ))}
              {selectedAmenities.length > 4 && (
                <span className="text-[10px] text-slate-400">+{selectedAmenities.length - 4} more</span>
              )}
            </div>
          )}
          <div className="admin-listing-preview-footer">
            <span className="text-[10px] uppercase text-slate-400">{data.type || 'HOTEL'}</span>
            <p className="text-right">
              <span className="text-xs text-slate-500">From </span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(minPrice || 0)}</span>
              <span className="text-xs text-slate-500"> / night</span>
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
