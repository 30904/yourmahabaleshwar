import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/common/Logo';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const VENDOR_TYPES = [
  { value: 'HOTEL', labelKey: 'vendor.types.hotel' },
  { value: 'RESORT', labelKey: 'vendor.types.resort' },
  { value: 'HOMESTAY', labelKey: 'vendor.types.homestay' },
  { value: 'TENT', labelKey: 'vendor.types.tent' },
  { value: 'GUIDE', labelKey: 'vendor.types.guide' },
  { value: 'TAXI', labelKey: 'vendor.types.taxi' },
  { value: 'DRIVER', labelKey: 'vendor.types.driver' },
  { value: 'HORSE', labelKey: 'vendor.types.horse' },
  { value: 'PRODUCT', labelKey: 'vendor.types.product' },
];

export default function VendorRegisterPage() {
  const { t } = useTranslation();
  const { register: reg, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { vendorType: 'HOTEL' },
  });
  const { verifyOtp, sendOtp, pendingOtp, setPendingOtp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form');
  const [otpCode, setOtpCode] = useState('');
  const [devHint, setDevHint] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { data: res } = await api.post('/auth/register-vendor', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        vendorType: data.vendorType,
        businessName: data.businessName,
      });
      const payload = res.data;
      if (payload?.requiresOtp) {
        setPendingOtp({
          identifier: data.phone || data.email,
          phone: data.phone,
          email: data.email,
          purpose: 'SIGNUP',
        });
        setStep('otp');
        if (payload.devCode) setDevHint(payload.devCode);
        toast.success(t('auth.otpSent'));
      } else {
        toast.success(t('vendor.registerSuccess'));
        navigate('/login');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || t('vendor.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp({
        identifier: pendingOtp?.identifier || watch('phone') || watch('email'),
        code: otpCode,
        purpose: 'SIGNUP',
      });
      toast.success(t('vendor.registerSuccess'));
      const vendorType = String(watch('vendorType') || '').toUpperCase();
      if (vendorType === 'HOTEL' || vendorType === 'RESORT') {
        navigate(`/dashboard/vendor/listings/new?type=${vendorType}&onboarding=1`);
      } else {
        navigate('/dashboard/vendor/kyc');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.invalidOtp'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-white py-8">
        <div className="page-container flex flex-col items-center">
          <Logo variant="auth" />
        </div>
      </div>
      <div className="page-container flex justify-center py-12">
        <div className="card w-full max-w-lg p-8">
          <h1 className="text-2xl font-bold">{t('vendor.registerTitle')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('vendor.registerSubtitle')}</p>

          {step === 'form' ? (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <label className="block text-sm font-medium">
                {t('vendor.vendorType')}
                <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" {...reg('vendorType', { required: true })}>
                  {VENDOR_TYPES.map((v) => (
                    <option key={v.value} value={v.value}>{t(v.labelKey)}</option>
                  ))}
                </select>
              </label>
              <Input label={t('vendor.businessName')} {...reg('businessName')} />
              <Input label={t('auth.fullName')} {...reg('name', { required: true })} error={errors.name && t('common.required')} />
              <Input label={t('auth.email')} type="email" {...reg('email', { required: true })} />
              <Input label={t('auth.phone')} {...reg('phone', { required: true })} />
              <Input label={t('auth.password')} type="password" {...reg('password', { required: true, minLength: 6 })} />
              <Input
                label={t('auth.confirmPassword')}
                type="password"
                {...reg('confirm', { validate: (v) => v === watch('password') || t('auth.mismatch') })}
                error={errors.confirm?.message}
              />
              {(watch('vendorType') === 'HOTEL' || watch('vendorType') === 'RESORT') && (
                <p className="rounded-lg bg-blue-50 p-3 text-sm text-slate-700">
                  After OTP verification you will complete the full hotel/resort registration form (property details, bank, terms).
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.creating') : t('vendor.registerCta')}
              </Button>
            </form>
          ) : (
            <form onSubmit={onVerify} className="mt-6 space-y-4">
              <p className="text-sm text-slate-600">{t('auth.otpHint')}</p>
              {devHint && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">Dev OTP: {devHint}</p>}
              <Input label={t('auth.otp')} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.verifying') : t('auth.verifyOtp')}
              </Button>
              <button
                type="button"
                className="w-full text-sm text-primary"
                onClick={async () => {
                  const identifier = pendingOtp?.identifier || watch('phone') || watch('email');
                  const channel = watch('phone') ? 'PHONE' : 'EMAIL';
                  const data = await sendOtp({ identifier, channel, purpose: 'SIGNUP' });
                  if (data?.devCode) setDevHint(data.devCode);
                  toast.success(t('auth.otpSent'));
                }}
              >
                {t('auth.resendOtp')}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="font-semibold text-primary">{t('auth.signIn')}</Link>
            {' · '}
            <Link to="/register" className="font-semibold text-primary">{t('auth.createAccount')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
