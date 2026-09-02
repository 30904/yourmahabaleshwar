import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function ServiceBookingLandingPage({ bookPath, listPath, titleKey, descKey }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <Card className="space-y-6 p-10">
        <h1 className="text-2xl font-bold text-slate-900">{t(titleKey)}</h1>
        <p className="text-slate-600">{t(descKey)}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to={bookPath}>
            <Button>{t('serviceBooking.bookNow')}</Button>
          </Link>
          {listPath && (
            <Link to={listPath} className="btn-outline inline-flex items-center px-4 py-2 text-sm">
              {t('serviceBooking.browseListings')}
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}
