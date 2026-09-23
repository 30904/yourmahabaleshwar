import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Calendar, Users, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const INLINE_SEARCH_ROUTES = new Set(['/hotels', '/resorts', '/homestays', '/tents']);

export default function BookingSearchBar({
  compact = false,
  defaultDestination = 'Mahabaleshwar',
  mode = 'auto',
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [destination, setDestination] = useState(defaultDestination);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState({ adults: 2, rooms: 1 });

  useEffect(() => {
    setDestination(defaultDestination);
  }, [defaultDestination]);

  const guestOptions = [
    { value: '2-1', labelKey: 'search.guests2_1' },
    { value: '2-2', labelKey: 'search.guests2_2' },
    { value: '4-1', labelKey: 'search.guests4_1' },
    { value: '4-2', labelKey: 'search.guests4_2' },
  ];

  const usesInlineSearch =
    mode === 'inline' || (mode === 'auto' && INLINE_SEARCH_ROUTES.has(location.pathname));

  const handleSearch = (e) => {
    e?.preventDefault();
    const query = destination.trim();

    if (usesInlineSearch) {
      const next = new URLSearchParams(searchParams);
      if (query) next.set('q', query);
      else next.delete('q');
      setSearchParams(next, { replace: false });
      return;
    }

    if (!query) return;

    const params = new URLSearchParams({
      q: query,
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
            className="w-full border-0 bg-transparent text-sm font-medium text-slate-900 caret-slate-900 placeholder:text-slate-400 outline-none"
            placeholder={t('search.placeholderWhere')}
          />
        </div>
        <button type="submit" className="btn-primary m-2 px-6">
          <Search size={18} /> {t('common.search')}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className="search-widget max-w-5xl">
      <div className="search-field lg:flex-[1.4]">
        <span className="search-field-label">{t('search.destination')}</span>
        <div className="mt-1 flex items-center gap-2">
          <MapPin size={20} className="shrink-0 text-primary" />
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full border-0 bg-transparent p-0 text-base font-medium text-slate-900 outline-none"
            placeholder={t('search.placeholderDestination')}
          />
        </div>
      </div>
      <div className="search-field lg:flex-1">
        <span className="search-field-label">{t('search.checkIn')}</span>
        <div className="mt-1 flex items-center gap-2">
          <Calendar size={18} className="text-slate-400" />
          <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none" />
        </div>
      </div>
      <div className="search-field lg:flex-1">
        <span className="search-field-label">{t('search.checkOut')}</span>
        <div className="mt-1 flex items-center gap-2">
          <Calendar size={18} className="text-slate-400" />
          <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none" />
        </div>
      </div>
      <div className="search-field lg:flex-1">
        <span className="search-field-label">{t('search.guestsRooms')}</span>
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
            {guestOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className="btn-primary m-2 min-h-[52px] px-8 lg:m-2 lg:min-w-[140px]">
        <Search size={20} />
        {t('common.search')}
      </button>
    </form>
  );
}
