import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ImageUploadField from '../../components/ui/ImageUploadField';

/** Listing profile / cover image upload with S3-ready storage paths. */
export default function ListingImageField({ label, value, onChange, vertical, hint, className = 'sm:col-span-2' }) {
  const { id, vertical: verticalParam } = useParams();
  const { user } = useAuth();
  const tenant = String(vertical || verticalParam || 'listing').toLowerCase();

  return (
    <ImageUploadField
      className={className}
      label={label}
      hint={hint || 'Drag & drop or click · JPG, PNG or WebP'}
      value={value || ''}
      onChange={onChange}
      category="listing-image"
      meta={{
        tenant,
        listingId: id || user?._id,
      }}
      accept="image/jpeg,image/png,image/webp"
    />
  );
}
