import { useState } from 'react';
import toast from 'react-hot-toast';
import FileDropzone from './FileDropzone';
import { uploadStorageFile } from '../../services/uploadApi';
import { getMediaUrl } from '../../utils/mediaUrl';

/**
 * Image/document upload field — uploads immediately and stores the returned key/URL.
 */
export default function ImageUploadField({
  label,
  hint = 'JPG, PNG, WebP or PDF',
  value = '',
  onChange,
  category,
  meta = {},
  accept,
  disabled = false,
  className = '',
}) {
  const [uploading, setUploading] = useState(false);
  const [localFile, setLocalFile] = useState(null);

  const handleFile = async (file) => {
    if (!file) {
      setLocalFile(null);
      onChange?.('');
      return;
    }
    setLocalFile(file);
    setUploading(true);
    try {
      const result = await uploadStorageFile(file, { category, ...meta });
      onChange?.(result.key || result.url);
      setLocalFile(null);
      toast.success('File uploaded');
    } catch (err) {
      setLocalFile(null);
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <FileDropzone
        label={label}
        hint={uploading ? 'Uploading…' : hint}
        value={localFile}
        existingUrl={!localFile ? value : ''}
        onChange={handleFile}
        onClearExisting={() => onChange?.('')}
        accept={accept}
        disabled={disabled || uploading}
      />
      {value && !localFile && (
        <a
          href={getMediaUrl(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs text-primary underline"
        >
          View uploaded file
        </a>
      )}
    </div>
  );
}
