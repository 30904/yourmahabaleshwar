import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Logo from '../../components/common/Logo';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      toast.success(t('auth.resetSent'));
    } catch (e) {
      toast.error(e.response?.data?.message || t('auth.resetFailed'));
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-slate-900">{t('auth.forgotTitle')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('auth.forgotHint')}</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              {...register('email', { required: true })}
              error={errors.email && t('common.required')}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.sendingReset') : t('auth.sendReset')}
            </Button>
          </form>
          <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-primary hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
