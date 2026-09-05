import { useRef, useState } from 'react';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadStorageFile } from '../../../services/uploadApi';
import { getMediaUrl } from '../../../utils/mediaUrl';

export default function PropertyPhotoGallery({ images, coverIndex, onChange, onCoverChange, propertyId }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const keys = await Promise.all(
        files.map(async (file) => {
          const result = await uploadStorageFile(file, {
            category: 'property-image',
            propertyId: propertyId || 'draft',
          });
          return result.key || result.url;
        })
      );
      onChange([...images, ...keys]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    await uploadFiles(files);
    e.target.value = '';
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith('image/'));
    await uploadFiles(files);
  };

  const remove = (index) => {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
    if (coverIndex >= next.length) onCoverChange(Math.max(0, next.length - 1));
    else if (coverIndex > index) onCoverChange(coverIndex - 1);
  };

  return (
    <div className="admin-photo-gallery">
      <div
        className={`admin-photo-upload ${dragOver ? 'file-dropzone-active' : ''}`}
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !uploading && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={onPick} disabled={uploading} />
        <ImagePlus size={28} className="text-admin-primary" />
        <span className="font-semibold text-slate-800">
          {uploading ? 'Uploading…' : 'Drag & drop property photos'}
        </span>
        <span className="text-xs text-slate-500">PNG, JPG · Min 3 photos recommended for best conversion</span>
        <span className="admin-btn-secondary mt-2 !text-sm pointer-events-none">Choose files</span>
      </div>

      {images.length > 0 && (
        <div className="admin-photo-grid">
          {images.map((src, i) => (
            <div key={`${i}-${String(src).slice(0, 24)}`} className={`admin-photo-item ${i === coverIndex ? 'admin-photo-item-cover' : ''}`}>
              <img src={getMediaUrl(src)} alt="" />
              {i === coverIndex && (
                <span className="admin-photo-cover-badge">
                  <Star size={12} fill="currentColor" /> Cover photo
                </span>
              )}
              <div className="admin-photo-actions">
                <button type="button" title="Set as cover" onClick={() => onCoverChange(i)} className="admin-photo-action-btn">
                  <Star size={14} />
                </button>
                <button type="button" title="Remove" onClick={() => remove(i)} className="admin-photo-action-btn admin-photo-action-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
