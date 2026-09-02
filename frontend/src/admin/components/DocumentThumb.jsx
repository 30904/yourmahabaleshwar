import { FileText, ExternalLink } from 'lucide-react';
import { getMediaUrl, isImageUrl, isPdfUrl } from '../../utils/mediaUrl';

export default function DocumentThumb({ label, url, className = '' }) {
  if (!url) return null;
  const href = getMediaUrl(url);
  const image = isImageUrl(url);
  const pdf = isPdfUrl(url);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`document-thumb ${className}`}
      title={label}
    >
      {image ? (
        <img src={href} alt={label} className="document-thumb-img" />
      ) : (
        <div className="document-thumb-pdf">
          <FileText size={28} />
        </div>
      )}
      <span className="document-thumb-label">
        {label}
        <ExternalLink size={12} className="inline ml-1 opacity-60" />
      </span>
    </a>
  );
}

const KYC_DOC_FIELDS = [
  { key: 'aadharDoc', label: 'Aadhaar' },
  { key: 'panDoc', label: 'PAN' },
  { key: 'gstDoc', label: 'GST' },
  { key: 'bankProofDoc', label: 'Bank proof' },
  { key: 'businessRegDoc', label: 'Business registration' },
  { key: 'hotelLicenseDoc', label: 'Hotel license' },
  { key: 'guideLicenseDoc', label: 'Guide license' },
  { key: 'addressProofDoc', label: 'Address proof' },
  { key: 'rcDoc', label: 'Vehicle RC' },
  { key: 'insuranceDoc', label: 'Insurance' },
  { key: 'fitnessDoc', label: 'Fitness' },
  { key: 'permitDoc', label: 'Permit' },
  { key: 'licenseDoc', label: 'License' },
  { key: 'pucDoc', label: 'PUC' },
];

export function KycDocumentGrid({ kyc, className = '' }) {
  const items = KYC_DOC_FIELDS.filter((f) => kyc?.[f.key]);
  if (!items.length) return <p className="text-sm text-slate-500">No documents uploaded.</p>;

  return (
    <div className={`document-thumb-grid ${className}`}>
      {items.map((f) => (
        <DocumentThumb key={f.key} label={f.label} url={kyc[f.key]} />
      ))}
    </div>
  );
}
