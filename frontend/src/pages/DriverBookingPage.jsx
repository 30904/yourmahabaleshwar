import { useTranslation } from 'react-i18next';
import DriverGuestBookingForm from '../components/booking/DriverGuestBookingForm';
import '../styles/ServiceBookingPage.css';

export default function DriverBookingPage() {
  const { t } = useTranslation();
  return (
    <div className="service-booking-page">
      <div className="service-booking-page__inner">
        <header className="service-booking-page__header">
          <h1>{t('serviceBooking.driverTitle')}</h1>
          <p>{t('serviceBooking.openFormSubtitle')}</p>
        </header>
        <DriverGuestBookingForm openMode />
      </div>
    </div>
  );
}
