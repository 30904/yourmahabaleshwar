import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import HotelGuestBookingForm from '../../components/booking/HotelGuestBookingForm';
import HomestayGuestBookingForm from '../../components/booking/HomestayGuestBookingForm';
import TentGuestBookingForm from '../../components/booking/TentGuestBookingForm';
import GuideGuestBookingForm from '../../components/booking/GuideGuestBookingForm';
import TaxiGuestBookingForm from '../../components/booking/TaxiGuestBookingForm';
import DriverGuestBookingForm from '../../components/booking/DriverGuestBookingForm';
import HorseGuestBookingForm from '../../components/booking/HorseGuestBookingForm';
import { fetchMyBookings } from '../../services/bookingsApi';
import {
  fetchDriverBySlug,
  fetchGuideBySlug,
  fetchHomestayBySlug,
  fetchHorseBySlug,
  fetchHotelBySlug,
  fetchTentBySlug,
} from '../../services/listingsApi';
import { canCustomerEditBooking } from '../../utils/bookingEdit';

function listingDoc(booking) {
  return booking?.hotel || booking?.homestay || booking?.tent || booking?.guide || booking?.driver || booking?.horse || null;
}

function isOpenBooking(booking) {
  if (booking.serviceTenant === 'GUIDE' && !booking.guide) return true;
  if (booking.serviceTenant === 'TAXI' && !booking.driver) return true;
  if (booking.serviceTenant === 'DRIVER' && !booking.driver) return true;
  if (booking.serviceTenant === 'HORSE' && !booking.horse) return true;
  if (booking.serviceTenant === 'TENT' && !booking.tent) return true;
  if (booking.type === 'GUIDE' && !booking.guide) return true;
  if (booking.type === 'TAXI' && !booking.driver && booking.serviceTenant !== 'DRIVER') return true;
  if (booking.type === 'HORSE' && !booking.horse) return true;
  if (booking.type === 'TENT' && !booking.tent) return true;
  return false;
}

function EditForm({ booking, listing, rooms }) {
  const open = isOpenBooking(booking);
  if (booking.type === 'HOTEL' || booking.type === 'RESORT') {
    return (
      <HotelGuestBookingForm
        hotel={listing}
        rooms={rooms}
        initialRoomId={booking.room?._id || booking.room}
        editingBooking={booking}
      />
    );
  }
  if (booking.type === 'HOMESTAY') {
    return (
      <HomestayGuestBookingForm
        item={{ ...(listing || {}), rooms: listing?.rooms || rooms }}
        initialRoomId={booking.homestayRoomId}
        editingBooking={booking}
      />
    );
  }
  if (booking.type === 'TENT') {
    return <TentGuestBookingForm item={listing} openMode={open} editingBooking={booking} />;
  }
  if (booking.type === 'GUIDE') {
    return <GuideGuestBookingForm item={listing} openMode={open} editingBooking={booking} />;
  }
  if (booking.serviceTenant === 'DRIVER') {
    return <DriverGuestBookingForm item={listing} openMode={open} editingBooking={booking} />;
  }
  if (booking.type === 'TAXI' || booking.serviceTenant === 'TAXI') {
    return <TaxiGuestBookingForm item={listing} openMode={open} serviceTenant="TAXI" editingBooking={booking} />;
  }
  if (booking.type === 'HORSE' || booking.serviceTenant === 'HORSE') {
    return <HorseGuestBookingForm item={listing} openMode={open} editingBooking={booking} />;
  }
  return null;
}

export default function EditBookingPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [booking, setBooking] = useState(null);
  const [listing, setListing] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchMyBookings()
      .then(async (rows) => {
        const found = (rows || []).find((row) => String(row._id) === String(id));
        if (!found || !canCustomerEditBooking(found)) {
          if (!cancelled) setError(t('booking.editUnavailable'));
          return;
        }
        const doc = listingDoc(found);
        let nextListing = doc;
        let nextRooms = doc?.rooms || [];
        try {
          if (!isOpenBooking(found) && doc?.slug) {
            if (found.type === 'HOTEL' || found.type === 'RESORT') {
              const loaded = await fetchHotelBySlug(doc.slug);
              nextListing = loaded.hotel || doc;
              nextRooms = loaded.rooms || [];
            } else if (found.type === 'HOMESTAY') {
              nextListing = (await fetchHomestayBySlug(doc.slug)) || doc;
              nextRooms = nextListing?.rooms || [];
            } else if (found.type === 'TENT') {
              nextListing = (await fetchTentBySlug(doc.slug)) || doc;
            } else if (found.type === 'GUIDE') {
              nextListing = (await fetchGuideBySlug(doc.slug)) || doc;
            } else if (found.type === 'HORSE') {
              nextListing = (await fetchHorseBySlug(doc.slug)) || doc;
            } else if (found.driver) {
              nextListing = (await fetchDriverBySlug(doc.slug)) || doc;
            }
          }
        } catch {
          nextListing = doc;
          nextRooms = doc?.rooms || [];
        }
        if (cancelled) return;
        setBooking(found);
        setListing(nextListing);
        setRooms(nextRooms);
      })
      .catch(() => {
        if (!cancelled) setError(t('booking.editUnavailable'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  if (loading) return <Skeleton className="h-40" />;

  if (error || !booking) {
    return (
      <Card className="p-6">
        <p className="text-slate-600">{error || t('booking.editUnavailable')}</p>
        <Link to="/dashboard/customer/bookings" className="mt-3 inline-block font-semibold text-primary">
          {t('booking.myBookings')}
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold">{t('booking.editBooking')}</h2>
      <p className="mt-1 text-sm text-slate-500">{booking.bookingNumber}</p>
      <div className="mt-6">
        <EditForm booking={booking} listing={listing} rooms={rooms} />
      </div>
    </div>
  );
}
