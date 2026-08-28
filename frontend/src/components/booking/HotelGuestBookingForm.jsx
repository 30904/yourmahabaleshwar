import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { calcGST } from '../../utils/format';
import { createHotelBooking } from '../../services/bookingsApi';
import { fetchAvailability } from '../../services/listingsApi';
import { payForBooking } from '../../services/paymentsApi';
import { useAuth } from '../../context/AuthContext';
import StayGuestBookingFormCore from './StayGuestBookingFormCore';

const emptyTraveller = () => ({ fullName: '', age: '', gender: '', relationship: '' });

export default function HotelGuestBookingForm({ hotel, rooms = [], initialRoomId }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const roomList = rooms?.length ? rooms : hotel?.rooms || [];
  const isResort = hotel?.type === 'RESORT';
  const [unavailable, setUnavailable] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [form, setForm] = useState(() => ({
    checkIn: '',
    checkOut: '',
    checkInTime: hotel?.checkInTime || '14:00',
    checkOutTime: hotel?.checkOutTime || '11:00',
    roomId: initialRoomId || roomList[0]?._id || '',
    adults: 2,
    children: 0,
    leadFullName: user?.name || '',
    leadAge: '',
    leadGender: '',
    leadMobile: user?.phone || '',
    leadEmail: user?.email || '',
    leadAddress: '',
    leadCityState: 'Mahabaleshwar, Maharashtra',
    leadPincode: '',
    comingFrom: '',
    goingTo: '',
    purpose: 'TOURISM',
    idType: 'AADHAAR',
    idNumber: '',
    nationality: 'INDIAN',
    coTravellers: [emptyTraveller(), emptyTraveller(), emptyTraveller()],
    paymentMode: 'ONLINE',
    advanceAmount: '',
    acceptTerms: false,
  }));

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setTraveller = (index, key, value) => {
    setForm((prev) => {
      const next = [...(prev.coTravellers || [])];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, coTravellers: next };
    });
  };

  useEffect(() => {
    if (initialRoomId) setField('roomId', initialRoomId);
  }, [initialRoomId]);

  const room = useMemo(
    () => roomList.find((r) => String(r._id) === String(form.roomId)) || roomList[0],
    [roomList, form.roomId]
  );

  const nights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 1;
    return Math.max(1, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000));
  }, [form.checkIn, form.checkOut]);

  const subtotal = (room?.basePrice || hotel?.priceFrom || 0) * nights;
  const gst = calcGST(subtotal);
  const total = subtotal + gst;
  const dateBlocked = form.checkIn && unavailable.includes(form.checkIn);

  const termsSummary = useMemo(() => {
    const lines = t('hotelGuestBooking.termsSummary', { returnObjects: true });
    return Array.isArray(lines) ? lines : [];
  }, [t, i18n.language]);

  const fullTermsSections = useMemo(() => {
    const sections = t('hotelRegistration.fullTermsSections', { returnObjects: true });
    return Array.isArray(sections) ? sections : [];
  }, [t, i18n.language]);

  useEffect(() => {
    if (!hotel?._id || !form.checkIn) return;
    fetchAvailability('hotel', hotel._id, form.checkIn, form.checkOut || form.checkIn)
      .then((d) => setUnavailable(d.unavailable || []))
      .catch(() => setUnavailable([]));
  }, [hotel?._id, form.checkIn, form.checkOut]);

  const validate = () => {
    if (!form.checkIn || !form.checkOut) return t('stayGuestBooking.validation.datesRequired');
    if (dateBlocked) return t('booking.unavailable');
    if (!form.roomId && !roomList[0]?._id) return t('stayGuestBooking.validation.selectRoom');
    if (!String(form.leadFullName || '').trim()) return t('stayGuestBooking.validation.fullName');
    if (!String(form.leadMobile || '').trim()) return t('stayGuestBooking.validation.mobile');
    if (!String(form.idType || '').trim() || !String(form.idNumber || '').trim()) return t('stayGuestBooking.validation.idProof');
    if (Number(form.adults) < 1) return t('stayGuestBooking.validation.adults');
    if (!form.acceptTerms) return t('stayGuestBooking.validation.acceptTerms');
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const res = await createHotelBooking({
        hotelId: hotel._id,
        roomId: form.roomId || roomList[0]?._id,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: { adults: Number(form.adults) || 1, children: Number(form.children) || 0 },
        guestRegistration: {
          formDate: new Date().toISOString(),
          checkInTime: form.checkInTime,
          checkOutTime: form.checkOutTime,
          adults: Number(form.adults) || 1,
          children: Number(form.children) || 0,
          leadGuest: {
            fullName: form.leadFullName,
            age: form.leadAge ? Number(form.leadAge) : undefined,
            gender: form.leadGender || '',
            mobile: form.leadMobile,
            email: form.leadEmail,
            address: form.leadAddress,
            cityState: form.leadCityState,
            pincode: form.leadPincode,
            comingFrom: form.comingFrom,
            goingTo: form.goingTo,
            purpose: form.purpose || '',
          },
          idProof: {
            type: form.idType,
            number: form.idNumber,
            nationality: form.nationality || 'INDIAN',
          },
          coTravellers: (form.coTravellers || []).filter((c) => String(c.fullName || '').trim()),
          roomLabel: room?.name,
          totalNights: nights,
          tariff: room?.basePrice || 0,
          advanceAmount: form.advanceAmount !== '' ? Number(form.advanceAmount) : total,
          paymentMode: form.paymentMode || 'ONLINE',
          acceptTerms: true,
          acceptedTermsAt: new Date().toISOString(),
        },
      });
      const booking = res.data.data;
      toast.success(t('stayGuestBooking.bookingCreated'));
      try {
        await payForBooking(booking, user);
        toast.success(t('stayGuestBooking.paymentSuccess'));
      } catch {
        toast(t('stayGuestBooking.bookingSavedPayLater'));
      }
      navigate('/dashboard/customer/bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || t('stayGuestBooking.bookingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StayGuestBookingFormCore
      formTitle={t(isResort ? 'hotelGuestBooking.formTitleResort' : 'hotelGuestBooking.formTitleHotel')}
      formSubtitle={t('hotelGuestBooking.formSubtitle', { name: hotel?.name })}
      termsSummary={termsSummary}
      fullTermsTitle={t('hotelRegistration.fullTermsTitle')}
      fullTermsSections={fullTermsSections}
      acceptTermsLabel={t('hotelGuestBooking.acceptTerms')}
      form={form}
      setField={setField}
      setTraveller={setTraveller}
      roomList={roomList}
      room={room}
      nights={nights}
      subtotal={subtotal}
      gst={gst}
      total={total}
      dateBlocked={dateBlocked}
      submitting={submitting}
      legalOpen={legalOpen}
      setLegalOpen={setLegalOpen}
      onSubmit={onSubmit}
      purposeName="hotelPurpose"
      idTypeName="hotelIdType"
      paymentModeName="hotelPaymentMode"
    />
  );
}
