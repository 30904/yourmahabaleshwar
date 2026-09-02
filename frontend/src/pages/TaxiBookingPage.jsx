import { useTranslation } from 'react-i18next';
import TaxiGuestBookingForm from '../components/booking/TaxiGuestBookingForm';
import '../styles/ServiceBookingPage.css';

export default function TaxiBookingPage() {
  const { t } = useTranslation();
  return (
    <div className="service-booking-page">
      <div className="service-booking-page__inner">
        <header className="service-booking-page__header">
          <h1>{t('serviceBooking.taxiTitle')}</h1>
          <p>{t('serviceBooking.openFormSubtitle')}</p>
        </header>
        <TaxiGuestBookingForm openMode serviceTenant="TAXI" />
      </div>
    </div>
  );
}
