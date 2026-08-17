import { useRef } from 'react';
import { ImagePlus, Link2, Upload, X } from 'lucide-react';

export default function BannerForm({
  register,
  errors,
  imageFile,
  imagePreview,
  onImageFile,
  onClearImage,
  imageMode,
  onImageMode,
}) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    onImageFile(file);
    e.target.value = '';
  };

  return (
    <div className="admin-banner-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="admin-label">
          Title *
          <input className="admin-input" placeholder="Discover Mahabaleshwar" {...register('title', { required: 'Title is required' })} />
          {errors.title && <span className="admin-field-error">{errors.title.message}</span>}
        </label>
        <label className="admin-label">
          Subtitle
          <input className="admin-input" placeholder="Hotels, tents & more" {...register('subtitle')} />
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Banner image *</p>
        <div className="admin-banner-mode-tabs">
          <button
            type="button"
            className={imageMode === 'upload' ? 'admin-banner-mode-active' : ''}
            onClick={() => onImageMode('upload')}
          >
            <Upload size={16} /> Upload file
          </button>
          <button
            type="button"
            className={imageMode === 'url' ? 'admin-banner-mode-active' : ''}
            onClick={() => onImageMode('url')}
          >
            <Link2 size={16} /> Image URL
          </button>
        </div>

        {imageMode === 'upload' ? (
          <div className="mt-3">
            {imagePreview ? (
              <div className="admin-banner-preview-wrap">
                <img src={imagePreview} alt="Banner preview" className="admin-banner-preview-img" />
                <button type="button" className="admin-banner-preview-remove" onClick={onClearImage} aria-label="Remove image">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                className="admin-photo-upload"
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
              >
                <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
                <ImagePlus size={32} className="text-admin-primary" />
                <span className="font-semibold text-slate-800">Click to upload banner</span>
                <span className="text-xs text-slate-500">JPG, PNG or WebP · Recommended 1920×600px</span>
              </div>
            )}
            {imageFile && (
              <p className="mt-2 text-xs text-slate-500">
                Selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>
        ) : (
          <label className="admin-label mt-3 block">
            Image URL
            <input className="admin-input" placeholder="https://images.unsplash.com/..." {...register('imageUrl')} />
          </label>
        )}
      </div>
    </div>
  );
}

