import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { calcGST, formatCurrency } from '../../utils/format';
import {
  createTentBooking,
  createGuideBooking,
  createTaxiBooking,
  createHomestayBooking,
  createHorseBooking,
} from '../../services/bookingsApi';
import { fetchAvailability } from '../../services/listingsApi';
import { payForBooking } from '../../services/paymentsApi';
import { useAuth } from '../../context/AuthContext';

export default function ServiceBookingForm({ type, item }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      tentQuantity: 1,
      guidePackage: '6HR',
      bikeAddon: false,
      taxiType: 'PER_TRIP',
      hours: 4,
      roomId: item?.rooms?.[0]?._id || '',
      routeId: item?.routes?.[0]?._id || '',
    },
  });
  const [unavailable, setUnavailable] = useState([]);

  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');
  const guidePackage = watch('guidePackage');
  const bikeAddon = watch('bikeAddon');
  const taxiType = watch('taxiType');
  const hours = Number(watch('hours') || 1);
  const tentQuantity = Number(watch('tentQuantity') || 1);
  const roomId = watch('roomId');
  const routeId = watch('routeId');

  useEffect(() => {
    if (!item?._id || !checkIn) return;
    const from = checkIn;
    const to = checkOut || checkIn;
    const availType =
      type === 'tent' ? 'tent' : type === 'homestay' ? 'homestay' : type === 'horse' ? 'horse' : type === 'guide' ? 'guide' : type === 'taxi' ? 'driver' : null;
    if (!availType) return;
    fetchAvailability(availType, item._id, from, to)
      .then((d) => setUnavailable(d.unavailable || []))
      .catch(() => setUnavailable([]));
  }, [item?._id, checkIn, checkOut, type]);

  let subtotal = 0;
  if (type === 'tent') {
    const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000)) : 1;
    subtotal = (item?.pricePerNight || 0) * tentQuantity * nights;
  } else if (type === 'homestay') {
    const room = (item?.rooms || []).find((r) => String(r._id) === String(roomId)) || item?.rooms?.[0];
    const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000)) : 1;
    subtotal = (room?.basePrice || item?.priceFrom || 0) * nights;
  } else if (type === 'horse') {
    const route = (item?.routes || []).find((r) => String(r._id) === String(routeId)) || item?.routes?.[0];
    subtotal = route?.price || item?.priceFrom || 0;
  } else if (type === 'guide') {
    subtotal = guidePackage === '12HR' ? item.package12hr : item.package6hr;
    if (bikeAddon) subtotal += item.bikeAddonPrice || 0;
  } else if (type === 'taxi') {
    subtotal = taxiType === 'HOURLY' ? (item.hourlyRate || 0) * hours : item.perTripPrice || 0;
  }

  const gst = calcGST(subtotal);
  const total = subtotal + gst;
  const dateBlocked = checkIn && unavailable.includes(checkIn);

  const onSubmit = async (data) => {
    if (dateBlocked) {
      toast.error(t('booking.unavailable'));
      return;
    }
    try {
      let res;
      if (type === 'tent') {
        res = await createTentBooking({
          tentId: item._id,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          tentQuantity: Number(data.tentQuantity),
        });
      } else if (type === 'homestay') {
        res = await createHomestayBooking({
          homestayId: item._id,
          roomId: data.roomId || item.rooms?.[0]?._id,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          guests: { adults: 2, children: 0 },
        });
      } else if (type === 'horse') {
        res = await createHorseBooking({
          horseId: item._id,
          routeId: data.routeId || item.routes?.[0]?._id,
          checkIn: data.checkIn,
        });
      } else if (type === 'guide') {
        res = await createGuideBooking({
          guideId: item._id,
          guidePackage: data.guidePackage,
          bikeAddon: !!data.bikeAddon,
          checkIn: data.checkIn,
        });
      } else {
        res = await createTaxiBooking({
          driverId: item._id,
          taxiType: data.taxiType,
          hours: Number(data.hours),
          checkIn: data.checkIn,
        });
      }
      const booking = res.data.data;
      toast.success('Booking created — proceed to pay');
      try {
        await payForBooking(booking, user);
        toast.success('Payment successful');
      } catch {
        toast('Booking saved. You can pay from My Bookings.');
      }
      navigate('/dashboard/customer/bookings');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Booking failed');
    }
  };

  return (
    <Card>
      <h3 className="font-semibold text-slate-900">Book {item?.name}</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
        {(type === 'tent' || type === 'homestay') && (
          <>
            <Input label="Check-in" type="date" {...register('checkIn', { required: true })} />
            <Input label="Check-out" type="date" {...register('checkOut', { required: true })} />
            {type === 'tent' && <Input label="Tents" type="number" min={1} {...register('tentQuantity')} />}
            {type === 'homestay' && (
              <label className="block text-sm font-medium text-slate-700">
                Room
                <select {...register('roomId')} className="input-field mt-1" onChange={(e) => setValue('roomId', e.target.value)}>
                  {(item.rooms || []).map((r) => (
                    <option key={r._id} value={r._id}>{r.name} — {formatCurrency(r.basePrice)}</option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}
        {type === 'horse' && (
          <>
            <Input label="Date" type="date" {...register('checkIn', { required: true })} />
            <label className="block text-sm font-medium text-slate-700">
              Route
              <select {...register('routeId')} className="input-field mt-1">
                {(item.routes || []).map((r) => (
                  <option key={r._id} value={r._id}>{r.name} — {formatCurrency(r.price)}</option>
                ))}
              </select>
            </label>
          </>
        )}
        {type === 'guide' && (
          <>
            <Input label="Date" type="date" {...register('checkIn', { required: true })} />
            <label className="block text-sm font-medium text-slate-700">
              Package
              <select {...register('guidePackage')} className="input-field mt-1">
                <option value="6HR">6 hours — {formatCurrency(item.package6hr)}</option>
                <option value="12HR">12 hours — {formatCurrency(item.package12hr)}</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('bikeAddon')} />
              Bike add-on (+{formatCurrency(item.bikeAddonPrice || 0)})
            </label>
          </>
        )}
        {type === 'taxi' && (
          <>
            <Input label="Date" type="date" {...register('checkIn', { required: true })} />
            <label className="block text-sm font-medium text-slate-700">
              Trip type
              <select {...register('taxiType')} className="input-field mt-1">
                <option value="PER_TRIP">Per trip — {formatCurrency(item.perTripPrice)}</option>
                <option value="HOURLY">Hourly — {formatCurrency(item.hourlyRate)}/hr</option>
              </select>
            </label>
            {taxiType === 'HOURLY' && <Input label="Hours" type="number" min={1} {...register('hours')} />}
          </>
        )}
        {dateBlocked && <p className="text-sm text-red-600">{t('booking.unavailable')}</p>}
        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="mt-1 flex justify-between"><span>GST (12%)</span><span>{formatCurrency(gst)}</span></div>
          <div className="mt-2 flex justify-between font-bold text-primary">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={dateBlocked}>{t('booking.confirm')}</Button>
      </form>
    </Card>
  );
}
