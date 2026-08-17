import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Search } from 'lucide-react';

export default function BookingSearchBar({ compact = false, defaultDestination = 'Mahabaleshwar' }) {
  const navigate = useNavigate();
  const [destination, setDestination] = useState(defaultDestination);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState({ adults: 2, rooms: 1 });

  const handleSearch = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams({
      q: destination,
      ...(checkIn && { checkIn }),
      ...(checkOut && { checkOut }),
      adults: guests.adults,
      rooms: guests.rooms,
    });
    navigate(`/search?${params.toString()}`);
  };

  if (compact) {
    return (
      <form onSubmit={handleSearch} className="search-widget max-w-5xl">
        <div className="search-field flex flex-1 flex-row items-center gap-3 border-b-0 lg:border-r">
          <MapPin size={20} className="shrink-0 text-primary" />
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full border-0 bg-transparent text-sm font-medium outline-none"
            placeholder="Where are you going?"
          />
        </div>
        <button type="submit" className="btn-primary m-2 px-6">
          <Search size={18} /> Search
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className="search-widget max-w-5xl">
      <div className="search-field lg:flex-[1.4]">
        <span className="search-field-label">Destination</span>
        <div className="mt-1 flex items-center gap-2">
          <MapPin size={20} className="shrink-0 text-primary" />
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full border-0 bg-transparent p-0 text-base font-medium text-slate-900 outline-none"
            placeholder="City, property, or landmark"
          />
        </div>
      </div>
      <div className="search-field lg:flex-1">
        <span className="search-field-label">Check-in</span>
        <div className="mt-1 flex items-center gap-2">
          <Calendar size={18} className="text-slate-400" />
          <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none" />
        </div>
      </div>
      <div className="search-field lg:flex-1">
        <span className="search-field-label">Check-out</span>
        <div className="mt-1 flex items-center gap-2">
          <Calendar size={18} className="text-slate-400" />
          <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none" />
        </div>
      </div>
      <div className="search-field lg:flex-1">
        <span className="search-field-label">Guests & rooms</span>
        <div className="mt-1 flex items-center gap-2">
          <Users size={18} className="text-slate-400" />
          <select
            value={`${guests.adults}-${guests.rooms}`}
            onChange={(e) => {
              const [a, r] = e.target.value.split('-').map(Number);
              setGuests({ adults: a, rooms: r });
            }}
            className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none"
          >
            <option value="2-1">2 adults · 1 room</option>
            <option value="2-2">2 adults · 2 rooms</option>
            <option value="4-1">4 adults · 1 room</option>
            <option value="4-2">4 adults · 2 rooms</option>
          </select>
        </div>
      </div>
      <button type="submit" className="btn-primary m-2 min-h-[52px] px-8 lg:m-2 lg:min-w-[140px]">
        <Search size={20} />
        Search
      </button>
    </form>
  );
}
