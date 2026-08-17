import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/common/Logo';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register: reg, handleSubmit, watch, formState: { errors } } = useForm();
  const { register: signup, verifyOtp, pendingOtp, sendOtp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form');
  const [otpCode, setOtpCode] = useState('');
  const [devHint, setDevHint] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await signup({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      if (result?.requiresOtp) {
        setStep('otp');
        if (result.devCode) setDevHint(result.devCode);
        toast.success(t('auth.otpSent'));
      } else {
        toast.success(t('auth.accountCreated'));
        navigate('/dashboard/customer');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp({
        identifier: pendingOtp?.identifier,
        code: otpCode,
        purpose: 'SIGNUP',
      });
      toast.success(t('auth.accountCreated'));
      navigate('/dashboard/customer');
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
        <div className="card w-full max-w-md p-8">
          <h1 className="text-2xl font-bold">{t('auth.createAccount')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('auth.registerSubtitle')}</p>
          {step === 'form' ? (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <Input label={t('auth.fullName')} {...reg('name', { required: true })} error={errors.name && t('common.required')} />
              <Input label={t('auth.email')} type="email" {...reg('email', { required: true })} />
              <Input label={t('auth.phone')} {...reg('phone', { required: true })} />
              <Input label={t('auth.password')} type="password" {...reg('password', { required: true, minLength: 6 })} />
              <Input
                label={t('auth.confirmPassword')}
                type="password"
                {...reg('confirm', { validate: (v) => v === watch('password') || t('auth.mismatch') })}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.creating') : t('auth.register')}
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
                  const channel = pendingOtp?.phone ? 'PHONE' : 'EMAIL';
                  const data = await sendOtp({
                    identifier: pendingOtp?.identifier,
                    channel,
                    purpose: 'SIGNUP',
                  });
                  if (data.devCode) setDevHint(data.devCode);
                  toast.success(t('auth.otpSent'));
                }}
              >
                {t('auth.resendOtp')}
              </button>
            </form>
          )}
          <p className="mt-4 text-center text-sm">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="font-semibold text-primary">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
