import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/common/Logo';

const roleRedirect = {
  SUPER_ADMIN: '/admin',
  OFFICE_STAFF_HOTEL: '/admin',
  OFFICE_STAFF_GUIDE: '/admin',
  MARKETING_STAFF: '/admin',
  HOTEL_VENDOR: '/dashboard/vendor',
  HOMESTAY_VENDOR: '/dashboard/vendor',
  TENT_OPERATOR: '/dashboard/vendor',
  GUIDE: '/dashboard/vendor',
  DRIVER: '/dashboard/vendor',
  HORSE_OPERATOR: '/dashboard/vendor',
  CUSTOMER: '/dashboard/customer',
};

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, verifyOtp, sendOtp, pendingOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('credentials');
  const { register, handleSubmit } = useForm();
  const [otpCode, setOtpCode] = useState('');
  const [devHint, setDevHint] = useState('');

  const finishLogin = (user) => {
    toast.success(t('auth.welcomeBack'));
    navigate(location.state?.from?.pathname || roleRedirect[user.role] || '/');
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result?.requiresOtp) {
        setStep('otp');
        if (result.devCode) setDevHint(result.devCode);
        toast.success(t('auth.otpSent'));
      } else {
        finishLogin(result);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await verifyOtp({
        identifier: pendingOtp?.identifier,
        code: otpCode,
        purpose: 'LOGIN',
      });
      finishLogin(user);
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.invalidOtp'));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    try {
      const channel = pendingOtp?.phone ? 'PHONE' : 'EMAIL';
      const data = await sendOtp({
        identifier: pendingOtp?.identifier,
        channel,
        purpose: 'LOGIN',
      });
      if (data.devCode) setDevHint(data.devCode);
      toast.success(t('auth.otpSent'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.loginFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-white py-8">
        <div className="page-container flex flex-col items-center">
          <Logo variant="auth" />
          <p className="mt-3 text-sm text-slate-500">{t('auth.signInSubtitle')}</p>
        </div>
      </div>
      <div className="page-container flex justify-center py-12">
        <div className="card w-full max-w-md p-8">
          <h1 className="text-2xl font-bold text-slate-900">{t('auth.signIn')}</h1>
          {step === 'credentials' ? (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
              <div>
                <label className="text-sm font-medium">{t('auth.email')}</label>
                <input className="input-field mt-1" type="email" {...register('email', { required: true })} />
              </div>
              <div>
                <label className="text-sm font-medium">{t('auth.password')}</label>
                <input className="input-field mt-1" type="password" {...register('password', { required: true })} />
              </div>
              <Link to="/forgot-password" className="block text-right text-sm text-primary hover:underline">
                {t('auth.forgotPassword')}
              </Link>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? t('auth.signingIn') : t('auth.continue')}
              </button>
            </form>
          ) : (
            <form onSubmit={onVerify} className="mt-8 space-y-4">
              <p className="text-sm text-slate-600">{t('auth.otpHint')}</p>
              {devHint && (
                <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">Dev OTP: {devHint}</p>
              )}
              <div>
                <label className="text-sm font-medium">{t('auth.otp')}</label>
                <input
                  className="input-field mt-1 tracking-widest"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? t('auth.verifying') : t('auth.verifyOtp')}
              </button>
              <button type="button" onClick={onResend} className="w-full text-sm text-primary">
                {t('auth.resendOtp')}
              </button>
            </form>
          )}
          <p className="mt-6 text-center text-sm">
            {t('auth.newHere')}{' '}
            <Link to="/register" className="font-bold text-primary">
              {t('auth.createAccount')}
            </Link>
          </p>
          <p className="mt-4 rounded-booking bg-blue-50 p-3 text-xs text-slate-600">
            Demo: admin@yourmahabaleshwar.com / Admin@123 (password only). Customer/vendor need OTP after password.
          </p>
        </div>
      </div>
    </div>
  );
}
