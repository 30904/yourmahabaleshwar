import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import { fetchPlatformSettings, updatePlatformSettings } from '../../../services/enterpriseAdminApi';

export default function SettingsPage() {
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchPlatformSettings().then(reset).catch(() => toast.error('Failed to load settings'));
  }, [reset]);

  const onSubmit = async (data) => {
    try {
      await updatePlatformSettings({
        ...data,
        commissionPercent: Number(data.commissionPercent),
        gstPercent: Number(data.gstPercent),
        stayListingDefaultRenewalPrice: Number(data.stayListingDefaultRenewalPrice),
        staySubscriptionWarningDays: Number(data.staySubscriptionWarningDays),
        whatsappEnabled: data.whatsappEnabled === true || data.whatsappEnabled === 'true',
      });
      toast.success('Settings saved');
    } catch {
      toast.error('Save failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <PageHeader
        title="Platform Settings"
        subtitle="Commission, payments, SMS/WhatsApp & SEO"
        actions={<button type="submit" className="admin-btn-primary">Save</button>}
      />

      <div className="admin-card grid gap-4 p-6 sm:grid-cols-2">
        <h3 className="sm:col-span-2 font-semibold text-slate-900">General</h3>
        <label className="admin-label">Platform Name<input className="admin-input" {...register('platformName')} /></label>
        <label className="admin-label">Commission %<input type="number" className="admin-input" {...register('commissionPercent')} /></label>
        <label className="admin-label">GST %<input type="number" className="admin-input" {...register('gstPercent')} /></label>
        <label className="admin-label">Support Email<input className="admin-input" {...register('supportEmail')} /></label>
        <label className="admin-label">Support Phone<input className="admin-input" {...register('supportPhone')} /></label>
        <label className="admin-label">Email From<input className="admin-input" {...register('emailFrom')} /></label>
      </div>

      <div className="admin-card grid gap-4 p-6 sm:grid-cols-2">
        <h3 className="sm:col-span-2 font-semibold text-slate-900">Payments (Razorpay)</h3>
        <label className="admin-label">Key ID<input className="admin-input" {...register('razorpayKeyId')} /></label>
        <label className="admin-label">Key Secret<input className="admin-input" type="password" {...register('razorpayKeySecret')} /></label>
        <label className="admin-label sm:col-span-2">
          Webhook Secret
          <input className="admin-input" type="password" {...register('razorpayWebhookSecret')} />
          <span className="mt-1 block text-xs text-slate-500">
            Also set RAZORPAY_WEBHOOK_SECRET in backend .env. Endpoint: POST /api/webhooks/razorpay
          </span>
        </label>
      </div>

      <div className="admin-card grid gap-4 p-6 sm:grid-cols-2">
        <h3 className="sm:col-span-2 font-semibold text-slate-900">SMS & WhatsApp</h3>
        <label className="admin-label">SMS Provider<input className="admin-input" {...register('smsProvider')} placeholder="FAST2SMS / MSG91" /></label>
        <label className="admin-label">SMS Sender ID<input className="admin-input" {...register('smsSenderId')} /></label>
        <label className="admin-label sm:col-span-2">SMS API Key<input className="admin-input" type="password" {...register('smsApiKey')} /></label>
        <label className="admin-label">WhatsApp API URL<input className="admin-input" {...register('whatsappApiUrl')} /></label>
        <label className="admin-label">WhatsApp Token<input className="admin-input" type="password" {...register('whatsappApiToken')} /></label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" {...register('whatsappEnabled')} /> Enable WhatsApp campaigns
        </label>
      </div>

      <div className="admin-card grid gap-4 p-6 sm:grid-cols-2">
        <h3 className="sm:col-span-2 font-semibold text-slate-900">Stay listing subscriptions</h3>
        <label className="admin-label">
          Default year-2+ renewal price (₹/year)
          <input type="number" min="0" className="admin-input" {...register('stayListingDefaultRenewalPrice')} />
        </label>
        <label className="admin-label">
          Ending-soon warning (days)
          <input type="number" min="1" className="admin-input" {...register('staySubscriptionWarningDays')} />
        </label>
        <p className="sm:col-span-2 text-sm text-slate-500">
          Used only when a listing has no price set yet. Each hotel, resort and homestay should have its own renewal price configured in the listing review screen.
        </p>
      </div>

      <div className="admin-card grid gap-4 p-6 sm:grid-cols-2">
        <h3 className="sm:col-span-2 font-semibold text-slate-900">SEO</h3>
        <label className="admin-label sm:col-span-2">SEO Title<input className="admin-input" {...register('seoTitle')} /></label>
        <label className="admin-label sm:col-span-2">SEO Description<textarea rows={3} className="admin-input" {...register('seoDescription')} /></label>
      </div>
    </form>
  );
}
