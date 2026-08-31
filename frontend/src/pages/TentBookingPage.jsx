import { useTranslation } from 'react-i18next';
import TentGuestBookingForm from '../components/booking/TentGuestBookingForm';
import '../styles/ServiceBookingPage.css';

export default function TentBookingPage() {
  const { t } = useTranslation();
  return (
    <div className="service-booking-page">
      <div className="service-booking-page__inner">
        <header className="service-booking-page__header">
          <h1>{t('serviceBooking.tentTitle')}</h1>
          <p>{t('serviceBooking.openFormSubtitle')}</p>
        </header>
        <TentGuestBookingForm openMode />
      </div>
    </div>
  );
}
