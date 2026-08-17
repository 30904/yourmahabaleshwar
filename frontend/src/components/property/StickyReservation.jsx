import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Check } from 'lucide-react';
import { formatCurrency, calcGST } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

export default function StickyReservation({ property, selectedRoom, pricePerNight }) {
  const { isAuthenticated } = useAuth();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000)) : 1;
  const rate = selectedRoom?.basePrice || pricePerNight || property?.priceFrom || 0;
  const subtotal = rate * nights;
  const gst = calcGST(subtotal);
  const total = subtotal + gst;

  return (
    <div className="card sticky top-24 border-2 border-amber-200/60 p-5 shadow-elevated">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          {property?.originalPrice && <span className="text-sm text-slate-400 line-through">{formatCurrency(property.originalPrice)}</span>}
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(rate)}<span className="text-base font-normal text-slate-500"> / night</span></p>
        </div>
        {property?.score && <span className="rounded-booking bg-primary px-2 py-1 text-sm font-bold text-white">{property.score}</span>}
      </div>
      <div className="mt-4 space-y-2 rounded-booking border border-border p-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1">Check-in <Calendar size={12} /></span>
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1 block w-full rounded border border-border px-2 py-1.5 text-sm" />
          </label>
          <label className="block text-xs font-semibold text-slate-500">
            Check-out
            <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1 block w-full rounded border border-border px-2 py-1.5 text-sm" />
          </label>
        </div>
        <label className="block text-xs font-semibold text-slate-500">Guests
          <select className="mt-1 w-full rounded border border-border px-2 py-1.5 text-sm"><option>2 adults</option><option>2 adults, 1 child</option></select>
        </label>
      </div>
      {selectedRoom && <p className="mt-3 text-sm font-medium text-slate-700">{selectedRoom.name} selected</p>}
      <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
        <div className="flex justify-between"><span>{nights} night(s) × {formatCurrency(rate)}</span><span>{formatCurrency(subtotal)}</span></div>
        <div className="flex justify-between text-slate-500"><span>GST (12%)</span><span>{formatCurrency(gst)}</span></div>
        <div className="flex justify-between font-bold text-slate-900"><span>Total</span><span>{formatCurrency(total)}</span></div>
      </div>
      {property?.freeCancellation && <p className="mt-3 flex items-center gap-1 text-xs text-secondary"><Check size={14} /> Free cancellation on select rates</p>}
      {isAuthenticated ? (
        <Link to="/dashboard/customer" className="btn-primary mt-4 block w-full text-center">Reserve now</Link>
      ) : (
        <Link to="/login" className="btn-primary mt-4 block w-full text-center">Sign in to book</Link>
      )}
      <p className="mt-2 text-center text-xs text-slate-500">You won&apos;t be charged yet</p>
    </div>
  );
}
