import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardList, UserCheck, CheckCircle2, Phone, X } from 'lucide-react';
import BookingSearchBar from '../../components/search/BookingSearchBar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ServiceHubGallery from '../../components/service/ServiceHubGallery';
import { fetchPublicServiceHubImages } from '../../services/listingsApi';
import { DEFAULT_SERVICE_HUB_LAYOUT } from '../../constants/serviceHubGallery';
import { SUPPORT_PHONES } from '../../constants/site';

const TENANT_CONFIG = {
  GUIDE: {
    bookPath: '/guides/book',
    titleKey: 'serviceBooking.guideTitle',
    descKey: 'serviceBooking.guideHubDesc',
    featureKeys: ['serviceBooking.guideFeature1', 'serviceBooking.guideFeature2', 'serviceBooking.guideFeature3'],
    enquireLabelKey: 'serviceBooking.enquireAboutGuide',
    enquireHintKey: 'serviceBooking.enquireGuideHint',
  },
  TAXI: {
    bookPath: '/taxi/book',
    titleKey: 'serviceBooking.taxiTitle',
    descKey: 'serviceBooking.taxiHubDesc',
    featureKeys: ['serviceBooking.taxiFeature1', 'serviceBooking.taxiFeature2', 'serviceBooking.taxiFeature3'],
    enquireLabelKey: 'serviceBooking.enquireAboutTaxi',
    enquireHintKey: 'serviceBooking.enquireTaxiHint',
  },
  DRIVER: {
    bookPath: '/drivers/book',
    titleKey: 'serviceBooking.driverTitle',
    descKey: 'serviceBooking.driverHubDesc',
    featureKeys: ['serviceBooking.driverFeature1', 'serviceBooking.driverFeature2', 'serviceBooking.driverFeature3'],
    enquireLabelKey: 'serviceBooking.enquireAboutDriver',
    enquireHintKey: 'serviceBooking.enquireDriverHint',
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
    enquireLabelKey: 'serviceBooking.enquireAboutHorse',
    enquireHintKey: 'serviceBooking.enquireHorseHint',
  },
};

const HUB_IMAGE_TENANTS = new Set(['GUIDE', 'TAXI', 'DRIVER', 'HORSE']);

function ServiceEnquireModal({ open, onClose, title, subtitle, closeLabel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" onClick={onClose} role="presentation">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>
          <button type="button" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={onClose} aria-label={closeLabel}>
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {SUPPORT_PHONES.map((phone) => (
            <a
              key={phone.href}
              href={phone.href}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-primary transition hover:border-primary/40 hover:bg-primary/5"
            >
              <Phone size={18} className="shrink-0" />
              <span className="font-semibold">{phone.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ServiceBookHubPage({ tenant }) {
  const { t } = useTranslation();
  const config = TENANT_CONFIG[tenant];
  const [hubImages, setHubImages] = useState([]);
  const [layout, setLayout] = useState(DEFAULT_SERVICE_HUB_LAYOUT);
  const [enquireOpen, setEnquireOpen] = useState(false);
  const showEnquire = Boolean(config?.enquireLabelKey);

  useEffect(() => {
    if (!HUB_IMAGE_TENANTS.has(tenant)) {
      setHubImages([]);
      setLayout(DEFAULT_SERVICE_HUB_LAYOUT);
      return undefined;
    }
    let cancelled = false;
    fetchPublicServiceHubImages()
      .then((data) => {
        if (cancelled) return;
        setHubImages(Array.isArray(data?.images?.[tenant]) ? data.images[tenant] : []);
        setLayout(data?.layouts?.[tenant] || DEFAULT_SERVICE_HUB_LAYOUT);
      })
      .catch(() => {
        if (!cancelled) {
          setHubImages([]);
          setLayout(DEFAULT_SERVICE_HUB_LAYOUT);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenant]);

  if (!config) return null;

  const steps = [
    { icon: ClipboardList, text: t('serviceBooking.step1') },
    { icon: UserCheck, text: t('serviceBooking.step2') },
    { icon: CheckCircle2, text: t('serviceBooking.step3') },
  ];

  const isSplit = layout === 'split' && hubImages.length > 0;

  const enquireButton = showEnquire ? (
    <button
      type="button"
      className="btn-outline inline-flex px-8 py-3 text-base"
      onClick={() => setEnquireOpen(true)}
    >
      {t(config.enquireLabelKey)}
    </button>
  ) : null;

  return (
    <div className="bg-background pb-16">
      <div className="bg-primary py-6">
        <div className="page-container">
          <BookingSearchBar compact />
        </div>
      </div>
      <div className="page-container py-10">
        {!isSplit && (
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold text-slate-900">{t(config.titleKey)}</h1>
            <p className="mt-3 text-slate-600">{t(config.descKey)}</p>
            <p className="mt-2 text-sm text-slate-500">{t('serviceBooking.noVendorPick')}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to={config.bookPath}>
                <Button className="px-8 py-3 text-base">{t('serviceBooking.bookNow')}</Button>
              </Link>
              {enquireButton}
            </div>
          </div>
        )}

        {hubImages.length > 0 && (
          <ServiceHubGallery
            images={hubImages}
            layout={layout}
            splitTitle={t(config.titleKey)}
            splitDescription={`${t(config.descKey)} ${t('serviceBooking.noVendorPick')}`}
            bookPath={config.bookPath}
            bookLabel={t('serviceBooking.bookNow')}
            secondaryAction={enquireButton}
          />
        )}

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

      <ServiceEnquireModal
        open={enquireOpen}
        onClose={() => setEnquireOpen(false)}
        title={showEnquire ? t(config.enquireLabelKey) : ''}
        subtitle={showEnquire ? t(config.enquireHintKey) : ''}
        closeLabel={t('serviceBooking.closeEnquire')}
      />
    </div>
  );
}
