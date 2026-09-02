import { useTranslation } from 'react-i18next';
import GuideGuestBookingForm from '../../components/booking/GuideGuestBookingForm';
import '../../styles/ServiceBookingPage.css';

export default function GuideBookingPage() {
  const { t } = useTranslation();
  return (
    <div className="service-booking-page">
      <div className="service-booking-page__inner">
        <header className="service-booking-page__header">
          <h1>{t('serviceBooking.guideTitle')}</h1>
          <p>{t('serviceBooking.openFormSubtitle')}</p>
        </header>
        <GuideGuestBookingForm openMode />
      </div>
    </div>
  );
}
