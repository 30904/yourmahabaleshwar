import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FileDropzone from '../../components/ui/FileDropzone';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ROLE_TO_VENDOR_TYPE = {
  HOTEL_VENDOR: 'HOTEL',
  HOMESTAY_VENDOR: 'HOMESTAY',
  TENT_OPERATOR: 'TENT',
  GUIDE: 'GUIDE',
  TAXI_OPERATOR: 'TAXI',
  DRIVER: 'DRIVER',
  HORSE_OPERATOR: 'HORSE',
};

const CODE_TO_FIELD = {
  AADHAAR: 'aadharDoc',
  PAN: 'panDoc',
  GST: 'gstDoc',
  BANK: 'bankProofDoc',
  BUSINESS_REG: 'businessRegDoc',
  HOTEL_LICENSE: 'hotelLicenseDoc',
  GUIDE_LICENSE: 'guideLicenseDoc',
  ADDRESS: 'addressProofDoc',
  RC: 'rcDoc',
  INSURANCE: 'insuranceDoc',
  FITNESS: 'fitnessDoc',
  PERMIT: 'permitDoc',
  LICENSE: 'licenseDoc',
  PUC: 'pucDoc',
};

const FALLBACK_DOCS = {
  HOTEL: [
    { code: 'AADHAAR', label: 'Aadhaar Card' },
    { code: 'PAN', label: 'PAN Card' },
    { code: 'GST', label: 'GST Certificate' },
    { code: 'BANK', label: 'Bank Proof' },
    { code: 'BUSINESS_REG', label: 'Business Registration' },
    { code: 'HOTEL_LICENSE', label: 'Hotel License' },
  ],
  RESORT: [
    { code: 'AADHAAR', label: 'Aadhaar Card' },
    { code: 'PAN', label: 'PAN Card' },
    { code: 'GST', label: 'GST Certificate' },
    { code: 'BANK', label: 'Bank Proof' },
    { code: 'BUSINESS_REG', label: 'Business Registration' },
    { code: 'HOTEL_LICENSE', label: 'Hotel License' },
  ],
  HOMESTAY: [
    { code: 'AADHAAR', label: 'Aadhaar Card' },
    { code: 'PAN', label: 'PAN Card' },
    { code: 'ADDRESS', label: 'Address Proof' },
    { code: 'BANK', label: 'Bank Proof' },
  ],
  TENT: [
    { code: 'AADHAAR', label: 'Aadhaar Card' },
    { code: 'PAN', label: 'PAN Card' },
    { code: 'BANK', label: 'Bank Proof' },
  ],
  GUIDE: [
    { code: 'AADHAAR', label: 'Aadhaar Card' },
    { code: 'GUIDE_LICENSE', label: 'Guide License' },
    { code: 'PAN', label: 'PAN Card' },
    { code: 'BANK', label: 'Bank Proof' },
  ],
  TAXI: [
    { code: 'LICENSE', label: 'Driving License' },
    { code: 'AADHAAR', label: 'Aadhaar Card' },
    { code: 'PAN', label: 'PAN Card' },
    { code: 'RC', label: 'Vehicle RC' },
    { code: 'INSURANCE', label: 'Insurance' },
    { code: 'FITNESS', label: 'Fitness' },
    { code: 'PERMIT', label: 'Permit' },
    { code: 'BANK', label: 'Bank Proof' },
  ],
  DRIVER: [
    { code: 'LICENSE', label: 'Driving License' },
    { code: 'AADHAAR', label: 'Aadhaar Card' },
    { code: 'PAN', label: 'PAN Card' },
    { code: 'RC', label: 'Vehicle RC' },
    { code: 'INSURANCE', label: 'Insurance' },
    { code: 'PUC', label: 'PUC Certificate' },
    { code: 'BANK', label: 'Bank Proof' },
  ],
  HORSE: [
    { code: 'AADHAAR', label: 'Aadhaar Card' },
    { code: 'PAN', label: 'PAN Card' },
    { code: 'BANK', label: 'Bank Proof' },
  ],
};

export default function VendorKYC() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const vendorType = ROLE_TO_VENDOR_TYPE[user?.role] || 'HOTEL';
  const [kyc, setKyc] = useState(null);
  const [docs, setDocs] = useState(FALLBACK_DOCS[vendorType] || FALLBACK_DOCS.HOTEL);
  const [files, setFiles] = useState({});
  const [bank, setBank] = useState({
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
    branch: '',
    upiId: '',
  });
  const [ids, setIds] = useState({ aadhar: '', pan: '', gstNumber: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [kycRes, reqRes] = await Promise.all([
          api.get('/users/kyc'),
          api.get('/admin/document-requirements', { params: { vendorType } }).catch(() => null),
        ]);
        const current = kycRes.data.data;
        setKyc(current);
        if (current?.bankDetails) setBank((b) => ({ ...b, ...current.bankDetails }));
        if (current) {
          setIds({
            aadhar: current.aadhar || '',
            pan: current.pan || '',
            gstNumber: current.gstNumber || '',
          });
        }
        const required = reqRes?.data?.data?.requiredDocs;
        if (Array.isArray(required) && required.length) setDocs(required);
      } catch {
        toast.error(t('vendor.kycLoadFailed'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vendorType, t]);

  const status = kyc?.status || 'PENDING';

  const uploadedHints = useMemo(() => {
    const map = {};
    docs.forEach((d) => {
      const field = CODE_TO_FIELD[d.code];
      if (field && kyc?.[field]) map[d.code] = kyc[field];
    });
    return map;
  }, [docs, kyc]);

  const onFile = (code, file) => {
    setFiles((prev) => ({ ...prev, [code]: file }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const form = new FormData();
      form.append('vendorType', vendorType);
      form.append('aadhar', ids.aadhar);
      form.append('pan', ids.pan);
      form.append('gstNumber', ids.gstNumber);
      form.append('bankDetails', JSON.stringify(bank));
      Object.entries(files).forEach(([code, file]) => {
        const field = CODE_TO_FIELD[code];
        if (field && file) form.append(field, file);
      });
      const { data } = await api.post('/users/kyc', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setKyc(data.data);
      setFiles({});
      toast.success(t('vendor.kycSubmitted'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('vendor.kycFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Card><p className="text-sm text-slate-500">{t('common.loading')}</p></Card>;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">{t('vendor.kycTitle')}</h2>
          <p className="mt-2 text-sm text-slate-600">{t('vendor.kycHint')}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            status === 'APPROVED'
              ? 'bg-emerald-50 text-emerald-700'
              : status === 'REJECTED'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-amber-50 text-amber-800'
          }`}
        >
          {status}
        </span>
      </div>
      {kyc?.rejectionReason && (
        <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
          {t('vendor.rejectionReason')}: {kyc.rejectionReason}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label={t('vendor.aadhaar')} value={ids.aadhar} onChange={(e) => setIds({ ...ids, aadhar: e.target.value })} />
          <Input label={t('vendor.pan')} value={ids.pan} onChange={(e) => setIds({ ...ids, pan: e.target.value })} />
          <Input label={t('vendor.gst')} value={ids.gstNumber} onChange={(e) => setIds({ ...ids, gstNumber: e.target.value })} />
        </div>

        <div>
          <h3 className="text-sm font-semibold">{t('vendor.bankDetails')}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label={t('vendor.accountHolder')} value={bank.accountHolder} onChange={(e) => setBank({ ...bank, accountHolder: e.target.value })} />
            <Input label={t('vendor.accountNumber')} value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} />
            <Input label={t('vendor.ifsc')} value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value })} />
            <Input label={t('vendor.bankName')} value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} />
            <Input label="Branch" value={bank.branch || ''} onChange={(e) => setBank({ ...bank, branch: e.target.value })} />
            <Input label={t('vendor.upi')} value={bank.upiId} onChange={(e) => setBank({ ...bank, upiId: e.target.value })} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {docs.map((d) => {
            const field = CODE_TO_FIELD[d.code];
            const existing = field ? uploadedHints[d.code] : '';
            return (
              <FileDropzone
                key={d.code}
                label={d.label}
                hint="JPG, PNG or PDF"
                value={files[d.code] || null}
                existingUrl={!files[d.code] ? existing : ''}
                onChange={(file) => onFile(d.code, file)}
                disabled={status === 'APPROVED'}
              />
            );
          })}
        </div>

        <Button type="submit" className="mt-2" disabled={saving || status === 'APPROVED'}>
          {saving ? t('common.loading') : t('vendor.submitKyc')}
        </Button>
      </form>
    </Card>
  );
}
