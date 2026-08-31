import { useTranslation } from 'react-i18next';
import HorseGuestBookingForm from '../components/booking/HorseGuestBookingForm';
import '../styles/ServiceBookingPage.css';

export default function HorseBookingPage() {
  const { t } = useTranslation();
  return (
    <div className="service-booking-page">
      <div className="service-booking-page__inner">
        <header className="service-booking-page__header">
          <h1>{t('serviceBooking.horseTitle')}</h1>
          <p>{t('serviceBooking.openFormSubtitle')}</p>
        </header>
        <HorseGuestBookingForm openMode />
      </div>
    </div>
  );
}
