import { useRef, useState } from 'react';
import { ImagePlus, Link2, Upload, X } from 'lucide-react';
import { getMediaUrl } from '../../../utils/mediaUrl';

export default function BlogCoverUpload({
  imageFile,
  imagePreview,
  existingUrl,
  imageMode,
  onImageMode,
  onImageFile,
  onClearImage,
  register,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const preview = imagePreview || (existingUrl && !imageFile ? getMediaUrl(existingUrl) : '');

  const handleFile = (file) => {
    if (!file?.type.startsWith('image/')) return;
    onImageFile(file);
  };

  const handleFileInput = (e) => {
    handleFile(e.target.files?.[0]);
    e.target.value = '';
  };

  return (
    <div className="admin-blog-cover">
      <p className="mb-2 text-sm font-semibold text-slate-700">Cover image</p>
      <div className="admin-banner-mode-tabs">
        <button
          type="button"
          className={imageMode === 'upload' ? 'admin-banner-mode-active' : ''}
          onClick={() => onImageMode('upload')}
        >
          <Upload size={16} /> Upload
        </button>
        <button
          type="button"
          className={imageMode === 'url' ? 'admin-banner-mode-active' : ''}
          onClick={() => onImageMode('url')}
        >
          <Link2 size={16} /> URL
        </button>
      </div>

      {imageMode === 'upload' ? (
        <div className="mt-3">
          {preview ? (
            <div className="admin-banner-preview-wrap admin-blog-cover-preview">
              <img src={preview} alt="Cover preview" className="admin-banner-preview-img" />
              <button type="button" className="admin-banner-preview-remove" onClick={onClearImage} aria-label="Remove">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              className={`admin-photo-upload admin-blog-cover-drop ${dragOver ? 'file-dropzone-active' : ''}`}
              role="button"
              tabIndex={0}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileInput} />
              <ImagePlus size={28} className="text-admin-primary" />
              <span className="font-semibold text-slate-800">Drag & drop cover image</span>
              <span className="text-xs text-slate-500">1200×630 recommended · JPG, PNG, WebP</span>
            </div>
          )}
        </div>
      ) : (
        <label className="admin-label mt-3 block">
          Image URL
          <input className="admin-input" placeholder="https://..." {...register('coverImageUrl')} />
        </label>
      )}
    </div>
  );
}

