import { useRef } from 'react';
import { ImagePlus, Star, Trash2 } from 'lucide-react';

export default function PropertyPhotoGallery({ images, coverIndex, onChange, onCoverChange }) {
  const inputRef = useRef(null);

  const addFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((urls) => onChange([...images, ...urls]));
    e.target.value = '';
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
        className="admin-photo-upload"
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={addFiles} />
        <ImagePlus size={28} className="text-admin-primary" />
        <span className="font-semibold text-slate-800">Upload property photos</span>
        <span className="text-xs text-slate-500">PNG, JPG · Min 3 photos recommended for best conversion</span>
        <span className="admin-btn-secondary mt-2 !text-sm pointer-events-none">Choose files</span>
      </div>

      {images.length > 0 && (
        <div className="admin-photo-grid">
          {images.map((src, i) => (
            <div key={`${i}-${src.slice(0, 24)}`} className={`admin-photo-item ${i === coverIndex ? 'admin-photo-item-cover' : ''}`}>
              <img src={src} alt="" />
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

