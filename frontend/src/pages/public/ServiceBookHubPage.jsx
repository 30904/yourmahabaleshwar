import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardList, UserCheck, CheckCircle2 } from 'lucide-react';
import BookingSearchBar from '../../components/search/BookingSearchBar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const TENANT_CONFIG = {
  GUIDE: {
    bookPath: '/guides/book',
    titleKey: 'serviceBooking.guideTitle',
    descKey: 'serviceBooking.guideHubDesc',
    featureKeys: ['serviceBooking.guideFeature1', 'serviceBooking.guideFeature2', 'serviceBooking.guideFeature3'],
  },
  TAXI: {
    bookPath: '/taxi/book',
    titleKey: 'serviceBooking.taxiTitle',
    descKey: 'serviceBooking.taxiHubDesc',
    featureKeys: ['serviceBooking.taxiFeature1', 'serviceBooking.taxiFeature2', 'serviceBooking.taxiFeature3'],
  },
  DRIVER: {
    bookPath: '/drivers/book',
    titleKey: 'serviceBooking.driverTitle',
    descKey: 'serviceBooking.driverHubDesc',
    featureKeys: ['serviceBooking.driverFeature1', 'serviceBooking.driverFeature2', 'serviceBooking.driverFeature3'],
  },
  TENT: {
    bookPath: '/tents/book',
    titleKey: 'serviceBooking.tentTitle',
    descKey: 'serviceBooking.tentHubDesc',
    featureKeys: ['serviceBooking.tentFeature1', 'serviceBooking.tentFeature2', 'serviceBooking.tentFeature3'],
  },
  HORSE: {
    bookPath: '/horses/book',
    titleKey: 'serviceBooking.horseTitle',
    descKey: 'serviceBooking.horseHubDesc',
    featureKeys: ['serviceBooking.horseFeature1', 'serviceBooking.horseFeature2', 'serviceBooking.horseFeature3'],
  },
};

export default function ServiceBookHubPage({ tenant }) {
  const { t } = useTranslation();
  const config = TENANT_CONFIG[tenant];
  if (!config) return null;

  const steps = [
    { icon: ClipboardList, text: t('serviceBooking.step1') },
    { icon: UserCheck, text: t('serviceBooking.step2') },
    { icon: CheckCircle2, text: t('serviceBooking.step3') },
  ];

  return (
    <div className="bg-background pb-16">
      <div className="bg-primary py-6">
        <div className="page-container">
          <BookingSearchBar compact />
        </div>
      </div>
      <div className="page-container py-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold text-slate-900">{t(config.titleKey)}</h1>
          <p className="mt-3 text-slate-600">{t(config.descKey)}</p>
          <p className="mt-2 text-sm text-slate-500">{t('serviceBooking.noVendorPick')}</p>
          <Link to={config.bookPath} className="mt-6 inline-block">
            <Button className="px-8 py-3 text-base">{t('serviceBooking.bookNow')}</Button>
          </Link>
        </div>

        <Card className="mx-auto mt-10 max-w-3xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">{t('serviceBooking.howItWorks')}</h2>
          <ol className="mt-6 space-y-4">
            {steps.map(({ icon: Icon, text }, i) => (
              <li key={text} className="flex gap-4 text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {t('serviceBooking.stepLabel', { n: i + 1 })}
                  </p>
                  <p className="mt-0.5 text-slate-700">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <ul className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
          {config.featureKeys.map((key) => (
            <li key={key} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-600">
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
