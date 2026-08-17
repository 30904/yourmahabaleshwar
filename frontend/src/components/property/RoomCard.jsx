import { Users, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

export default function RoomCard({ room, selected, onSelect }) {
  return (
    <div className={`card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div>
        <h4 className="font-bold text-slate-900">{room.name}</h4>
        <p className="text-sm text-slate-500">{room.type} · <Users size={14} className="inline" /> {room.capacity} guests</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {room.amenities?.map((a) => (
            <li key={a} className="flex items-center gap-1 text-xs text-slate-600"><Check size={12} className="text-secondary" />{a}</li>
          ))}
        </ul>
        {room.freeCancellation !== false && <p className="mt-2 text-xs font-medium text-secondary">Free cancellation</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <p className="text-xl font-bold">{formatCurrency(room.basePrice)}<span className="text-sm font-normal text-slate-500">/night</span></p>
        <button type="button" onClick={() => onSelect(room)} className={selected ? 'btn-primary' : 'btn-secondary'}>
          {selected ? 'Selected' : 'Select rooms'}
        </button>
      </div>
    </div>
  );
}
