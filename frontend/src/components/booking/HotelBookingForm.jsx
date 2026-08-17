import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { calcGST, formatCurrency } from '../../utils/format';

export default function HotelBookingForm({ hotelId, room, onSuccess }) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: { adults: 2, children: 0 },
  });

  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');
  const nights =
    checkIn && checkOut
      ? Math.max(
          1,
          Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
        )
      : 1;
  const subtotal = (room?.basePrice || 0) * nights;
  const gst = calcGST(subtotal);
  const total = subtotal + gst;

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/bookings/hotel', {
        hotelId,
        roomId: room._id,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: { adults: Number(data.adults), children: Number(data.children) },
      });
      toast.success('Booking created!');
      onSuccess?.(res.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Booking failed');
    }
  };

  return (
    <Card>
      <h3 className="font-semibold text-slate-900">Book {room?.name}</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
        <Input label="Check-in" type="date" {...register('checkIn', { required: true })} />
        <Input label="Check-out" type="date" {...register('checkOut', { required: true })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Adults" type="number" {...register('adults')} />
          <Input label="Children" type="number" {...register('children')} />
        </div>
        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between"><span>Subtotal ({nights} nights)</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between mt-1"><span>GST (12%)</span><span>{formatCurrency(gst)}</span></div>
          <div className="flex justify-between mt-2 font-bold text-primary"><span>Total</span><span>{formatCurrency(total)}</span></div>
        </div>
        <Button type="submit" className="w-full">Confirm Booking</Button>
      </form>
    </Card>
  );
}
