import { Upload, FileText, X, Eye } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { getMediaUrl } from '../../utils/mediaUrl';

const IMAGE_TYPES = /^image\//;
const PDF_TYPE = 'application/pdf';

/**
 * Drag-and-drop file picker for images and PDFs.
 * @param {object} props
 * @param {File|null} props.value - selected file (not yet uploaded)
 * @param {string} props.existingUrl - already-uploaded storage key or URL
 * @param {function} props.onChange - (file|null) => void
 * @param {function} [props.onClearExisting]
 * @param {string} [props.accept]
 * @param {string} [props.label]
 * @param {string} [props.hint]
 * @param {boolean} [props.disabled]
 * @param {string} [props.className]
 */
export default function FileDropzone({
  value,
  existingUrl,
  onChange,
  onClearExisting,
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  label,
  hint,
  disabled = false,
  className = '',
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = useCallback(
    (file) => {
      if (!file || disabled) return;
      onChange?.(file);
    },
    [disabled, onChange]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    pickFile(file);
  };

  const previewUrl = value ? URL.createObjectURL(value) : existingUrl ? getMediaUrl(existingUrl) : '';
  const isImage = value ? IMAGE_TYPES.test(value.type) : existingUrl && !String(existingUrl).toLowerCase().endsWith('.pdf');
  const isPdf = value ? value.type === PDF_TYPE : String(existingUrl || '').toLowerCase().endsWith('.pdf');

  return (
    <div className={className}>
      {label && <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>}
      <div
        className={`file-dropzone ${dragOver ? 'file-dropzone-active' : ''} ${disabled ? 'file-dropzone-disabled' : ''}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          disabled={disabled}
          onChange={(e) => {
            pickFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        {previewUrl && isImage ? (
          <img src={previewUrl} alt="" className="file-dropzone-preview" />
        ) : previewUrl && isPdf ? (
          <div className="file-dropzone-pdf">
            <FileText size={32} />
            <span className="text-sm font-medium">{value?.name || 'PDF document'}</span>
          </div>
        ) : (
          <div className="file-dropzone-placeholder">
            <Upload size={28} className="text-primary" />
            <span className="font-semibold text-slate-800">Drag & drop or click to upload</span>
            {hint && <span className="text-xs text-slate-500">{hint}</span>}
          </div>
        )}

        {(value || existingUrl) && !disabled && (
          <div className="file-dropzone-actions">
            {existingUrl && (
              <a
                href={getMediaUrl(existingUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="file-dropzone-action"
                onClick={(e) => e.stopPropagation()}
                title="View"
              >
                <Eye size={14} />
              </a>
            )}
            <button
              type="button"
              className="file-dropzone-action"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.(null);
                onClearExisting?.();
              }}
              title="Remove"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {value && (
          <p className="file-dropzone-filename">{value.name}</p>
        )}
        {existingUrl && !value && (
          <p className="file-dropzone-filename text-emerald-600">Uploaded</p>
        )}
      </div>
    </div>
  );
}
