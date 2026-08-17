import { useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadUploadTemplate, importUploadData } from '../../../services/enterpriseAdminApi';

export default function UploadCard({ type, label, description, icon: Icon, columnCount }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadUploadTemplate(type);
      toast.success('Template downloaded');
    } catch {
      toast.error('Could not download template');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (!/\.(xlsx|xls)$/i.test(picked.name)) {
      toast.error('Please choose an Excel file (.xlsx or .xls)');
      return;
    }
    setFile(picked);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Select a filled Excel file first');
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const res = await importUploadData(type, file);
      setResult(res.data);
      toast.success(res.message || 'Import completed');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <article className="upload-card admin-card">
      <div className="upload-card-header">
        <div className="upload-card-icon">
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="upload-card-title">{label}</h3>
          <p className="upload-card-desc">{description}</p>
          {columnCount != null && (
            <p className="upload-card-meta">{columnCount} columns in template</p>
          )}
        </div>
      </div>

      <div className="upload-card-actions">
        <button
          type="button"
          className="admin-btn-secondary w-full sm:w-auto"
          onClick={handleDownload}
          disabled={downloading || uploading}
        >
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Download template
        </button>

        <label className="upload-file-label">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <FileSpreadsheet size={16} />
          <span className="truncate">{file ? file.name : 'Choose Excel file'}</span>
        </label>

        <button
          type="button"
          className="admin-btn-primary w-full sm:w-auto"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? 'Importing…' : 'Upload & import'}
        </button>
      </div>

      {result && (
        <div className={`upload-result ${result.failed ? 'upload-result--warn' : 'upload-result--ok'}`}>
          {result.failed ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <div>
            <p className="font-semibold">
              {result.created} of {result.total} rows imported
              {result.failed > 0 ? ` · ${result.failed} skipped` : ''}
            </p>
            {result.errors?.length > 0 && (
              <ul className="upload-result-errors">
                {result.errors.slice(0, 5).map((err) => (
                  <li key={`${err.row}-${err.message}`}>
                    Row {err.row}: {err.message}
                  </li>
                ))}
                {result.errors.length > 5 && (
                  <li>…and {result.errors.length - 5} more issues</li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
