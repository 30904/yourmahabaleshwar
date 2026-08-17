import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'src');
const w = (rel, c) => {
  const fp = path.join(src, rel);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  let out = c;
  out = out.split('<motion></motion>').join('');
  out = out.split('</motion>').join('');
  fs.writeFileSync(fp, out);
};

w('components/property/ReviewScore.jsx', `export default function ReviewScore({ score, label, reviewCount, size = 'md' }) {
  if (!score) return null;
  const sizes = {
    sm: { box: 'min-w-[2rem] text-sm px-1.5 py-0.5', label: 'text-xs' },
    md: { box: 'min-w-[2.75rem] px-2 py-1', label: 'text-sm' },
    lg: { box: 'min-w-[3.25rem] px-3 py-1.5 text-lg', label: 'text-base' },
  };
  const s = sizes[size];
  return (
    <motion></motion>
    <div className="flex items-center gap-2">
      <div className={\`score-badge \${s.box}\`}>
        <span className="text-sm font-bold leading-none">{Number(score).toFixed(1)}</span>
      </div>
      <div>
        {label && <p className={\`font-semibold text-slate-900 \${s.label}\`}>{label}</p>}
        {reviewCount != null && <p className="text-xs text-slate-500">{reviewCount.toLocaleString('en-IN')} reviews</p>}
      </div>
    </div>
  );
}
`);

w('components/property/PropertyCard.jsx', `import { Link } from 'react-router-dom';
import { MapPin, Heart, Check } from 'lucide-react';
import ReviewScore from './ReviewScore';
import { formatCurrency } from '../../utils/format';

export default function PropertyCard({ item, linkPrefix, priceKey = 'priceFrom', priceSuffix = '/ night' }) {
  const image = item.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
  const price = item[priceKey] || item.pricePerNight || item.package6hr || item.perTripPrice;
  const original = item.originalPrice;

  return (
    <article className="property-card">
      <Link to={\`\${linkPrefix}/\${item.slug || item._id}\`} className="relative block w-full shrink-0 sm:w-[280px] lg:w-[300px]">
        <img src={image} alt={item.name} className="h-full min-h-[200px] w-full object-cover sm:min-h-[220px]" loading="lazy" />
        <button type="button" className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow hover:bg-white" onClick={(e) => e.preventDefault()} aria-label="Save">
          <Heart size={18} className="text-slate-600" />
        </button>
        {item.isFeatured && <span className="absolute left-0 top-3 bg-primary px-2 py-1 text-xs font-bold text-white">Featured</span>}
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link to={\`\${linkPrefix}/\${item.slug || item._id}\`}><h3 className="text-lg font-bold text-primary hover:underline">{item.name}</h3></Link>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} />{item.distance || item.address?.city || item.location || 'Mahabaleshwar'}</p>
          </div>
          <ReviewScore score={item.score || item.rating} label={item.scoreLabel} reviewCount={item.reviewCount} size="sm" />
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {item.freeCancellation && <span className="flex items-center gap-1 text-xs font-medium text-secondary"><Check size={14} /> Free cancellation</span>}
          {item.payAtProperty && <span className="text-xs text-slate-500">No prepayment needed</span>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <motion></motion>
          <div className="text-left sm:text-right">
            {original && <p className="text-sm text-slate-400 line-through">{formatCurrency(original)}</p>}
            <p className="text-xl font-bold text-slate-900">{formatCurrency(price)}</p>
            <p className="text-xs text-slate-500">{priceSuffix} · incl. taxes</p>
          </div>
          <Link to={\`\${linkPrefix}/\${item.slug || item._id}\`} className="btn-secondary shrink-0 px-4 py-2.5 text-sm">See availability</Link>
        </div>
      </div>
    </article>
  );
}
`);

w('components/property/PropertyFilters.jsx', `import { useState } from 'react';
import { SlidersHorizontal, Star } from 'lucide-react';

const priceRanges = ['Any', 'Under ₹2,000', '₹2,000 - ₹5,000', '₹5,000+'];
const ratings = [9, 8, 7, 6];
const amenitiesList = ['Free WiFi', 'Free parking', 'Breakfast included', 'Pool', 'Restaurant', 'Free cancellation'];

export default function PropertyFilters({ onChange }) {
  const [price, setPrice] = useState('Any');
  const [minRating, setMinRating] = useState(null);
  const [amenities, setAmenities] = useState([]);

  const toggleAmenity = (a) => {
    const next = amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a];
    setAmenities(next);
    onChange?.({ price, minRating, amenities: next });
  };

  return (
    <aside className="card sticky top-24 hidden p-5 lg:block">
      <h3 className="flex items-center gap-2 font-bold text-slate-900"><SlidersHorizontal size={18} /> Filter by</h3>
      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-700">Your budget (per night)</p>
        <div className="mt-2 space-y-2">
          {priceRanges.map((p) => (
            <label key={p} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="price" checked={price === p} onChange={() => { setPrice(p); onChange?.({ price: p, minRating, amenities }); }} className="accent-primary" />
              {p}
            </label>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <p className="text-sm font-semibold text-slate-700">Review score</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ratings.map((r) => (
            <button key={r} type="button" onClick={() => { setMinRating(r); onChange?.({ price, minRating: r, amenities }); }}
              className={\`filter-chip \${minRating === r ? 'filter-chip-active' : ''}\`}><Star size={14} className="fill-accent text-accent" /> {r}+</button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <p className="text-sm font-semibold text-slate-700">Amenities</p>
        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
          {amenitiesList.map((a) => (
            <label key={a} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={amenities.includes(a)} onChange={() => toggleAmenity(a)} className="accent-primary rounded" />
              {a}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
`);

w('components/property/ImageGallery.jsx', `import { useState } from 'react';
import { Grid2x2 } from 'lucide-react';

export default function ImageGallery({ images = [], name = 'Property' }) {
  const imgs = images.length ? images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'];
  const [main, setMain] = useState(0);

  return (
    <div className="relative grid gap-2 overflow-hidden rounded-booking sm:grid-cols-4 sm:grid-rows-2">
      <button type="button" className="relative col-span-2 row-span-2 min-h-[240px] sm:min-h-[380px]" onClick={() => setMain(0)}>
        <img src={imgs[main] || imgs[0]} alt={name} className="h-full w-full object-cover" />
      </button>
      {imgs.slice(1, 5).map((src, i) => (
        <button key={i} type="button" className="relative hidden min-h-[120px] overflow-hidden sm:block" onClick={() => setMain(i + 1)}>
          <img src={src} alt="" className="h-full w-full object-cover" />
        </button>
      ))}
      {imgs.length > 1 && (
        <span className="absolute bottom-4 right-4 flex items-center gap-2 rounded-booking border border-white bg-white px-3 py-2 text-sm font-semibold shadow">
          <Grid2x2 size={16} /> {imgs.length} photos
        </span>
      )}
    </div>
  );
}
`);

w('components/property/StickyReservation.jsx', `import { useState } from 'react';
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
          <label className="text-xs font-semibold text-slate-500">Check-in<Calendar className="inline ml-1" size={12} />
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1 block w-full rounded border border-border px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs font-semibold text-slate-500">Check-out
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
`);

w('components/property/RoomCard.jsx', `import { Users, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

export default function RoomCard({ room, selected, onSelect }) {
  return (
    <div className={\`card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between \${selected ? 'ring-2 ring-primary' : ''}\`}>
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
`);

w('components/common/TrustBadges.jsx', `import { Shield, BadgeCheck, Headphones, CreditCard } from 'lucide-react';

const badges = [
  { icon: Shield, title: 'Secure booking', desc: '256-bit SSL encryption' },
  { icon: BadgeCheck, title: 'Verified properties', desc: 'Every listing is vetted' },
  { icon: Headphones, title: '24/7 support', desc: 'Local team in Mahabaleshwar' },
  { icon: CreditCard, title: 'Flexible payment', desc: 'Pay online or at property' },
];

export default function TrustBadges() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {badges.map((b) => (
        <div key={b.title} className="flex gap-3 rounded-booking border border-border bg-white p-4">
          <b.icon className="shrink-0 text-primary" size={28} />
          <div><p className="font-semibold text-slate-900">{b.title}</p><p className="text-xs text-slate-500">{b.desc}</p></div>
        </div>
      ))}
    </div>
  );
}
`);

w('components/listings/AccommodationListingPage.jsx', `import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Map, ListFilter, ArrowUpDown } from 'lucide-react';
import api from '../../services/api';
import PropertyCard from '../property/PropertyCard';
import PropertyFilters from '../property/PropertyFilters';
import BookingSearchBar from '../search/BookingSearchBar';
import Skeleton from '../ui/Skeleton';

export default function AccommodationListingPage({ title, subtitle, apiQuery, fallbackData, linkPrefix, type = 'HOTEL' }) {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recommended');
  const [filters, setFilters] = useState({});
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/hotels', { params: { ...apiQuery, limit: 50, search: searchParams.get('q') } })
      .then((res) => setItems(res.data.data?.items || []))
      .catch(() => setItems(fallbackData))
      .finally(() => setLoading(false));
  }, [searchParams, apiQuery?.type]);

  const sorted = useMemo(() => {
    let list = [...items];
    if (filters.minRating) list = list.filter((i) => (i.score || i.rating) >= filters.minRating);
    if (sort === 'price_low') list.sort((a, b) => (a.priceFrom || 0) - (b.priceFrom || 0));
    if (sort === 'price_high') list.sort((a, b) => (b.priceFrom || 0) - (a.priceFrom || 0));
    if (sort === 'rating') list.sort((a, b) => (b.score || b.rating || 0) - (a.score || a.rating || 0));
    return list;
  }, [items, sort, filters]);

  return (
    <div className="bg-background pb-16">
      <div className="border-b border-border bg-primary py-6 text-white">
        <div className="page-container">
          <BookingSearchBar compact />
        </div>
      </div>
      <div className="page-container py-6">
        <nav className="text-sm text-slate-500">Home &gt; {title}</nav>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-1 text-slate-600">{subtitle} · <strong>{sorted.length}</strong> properties found</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <motion></motion>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowMap(!showMap)} className={\`filter-chip \${showMap ? 'filter-chip-active' : ''}\`}><Map size={16} /> Map</button>
            <span className="filter-chip lg:hidden"><ListFilter size={16} /> Filters</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ArrowUpDown size={16} className="text-slate-400" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field w-auto py-2 pr-8">
              <option value="recommended">Our top picks</option>
              <option value="price_low">Price (lowest first)</option>
              <option value="price_high">Price (highest first)</option>
              <option value="rating">Best reviewed</option>
            </select>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <PropertyFilters onChange={setFilters} />
          <div className="space-y-4">
            {showMap && (
              <div className="card flex h-48 items-center justify-center bg-slate-100 text-slate-500">Map view — integrate Google Maps API</div>
            )}
            {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52" />) :
              sorted.length === 0 ? <div className="card p-12 text-center text-slate-500">No properties match your filters.</div> :
              sorted.map((item) => <PropertyCard key={item._id} item={item} linkPrefix={linkPrefix} priceKey={type === 'tent' ? 'pricePerNight' : 'priceFrom'} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
`);

w('pages/public/HomePage.jsx', `import { Link } from 'react-router-dom';
import { Hotel, Tent, Users, Car, Star, ArrowRight, Sparkles } from 'lucide-react';
import BookingSearchBar from '../../components/search/BookingSearchBar';
import PropertyCard from '../../components/property/PropertyCard';
import TrustBadges from '../../components/common/TrustBadges';
import { dummyHotels, dummyTents, popularDestinations, deals } from '../../data/dummyListings';

const browse = [
  { to: '/hotels', icon: Hotel, label: 'Hotels', count: '450+ stays' },
  { to: '/resorts', icon: Star, label: 'Resorts', count: '80+ resorts' },
  { to: '/tents', icon: Tent, label: 'Tents', count: '50+ camps' },
  { to: '/guides', icon: Users, label: 'Guides', count: '100+ experts' },
  { to: '/taxi', icon: Car, label: 'Taxi', count: '200+ cabs' },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative bg-primary pb-16 pt-8 sm:pb-20 sm:pt-12">
        <motion></motion>
        <motion></motion>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80')] bg-cover bg-center opacity-15" />
        <div className="page-container relative">
          <p className="text-sm font-medium text-blue-200">India&apos;s trusted hill station booking platform</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
            Find your next stay in Mahabaleshwar
          </h1>
          <p className="mt-3 max-w-xl text-blue-100">Compare hotels, resorts & unique stays. Best prices, free cancellation on thousands of properties.</p>
          <div className="mt-8"><BookingSearchBar /></motion></motion></div>
        </div>
      </section>
      <section className="page-container -mt-6 relative z-10">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {browse.map((b) => (
            <Link key={b.to} to={b.to} className="card flex items-center gap-3 p-4 transition hover:shadow-elevated">
              <div className="flex h-11 w-11 items-center justify-center rounded-booking bg-blue-50 text-primary"><b.icon size={22} /></div>
              <div><p className="font-bold text-slate-900">{b.label}</p><p className="text-xs text-slate-500">{b.count}</p></div>
            </Link>
          ))}
        </div>
      </section>
      <section className="page-container py-12">
        <div className="flex items-end justify-between"><h2 className="text-2xl font-bold">Trending deals</h2></motion></motion></motion></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">{deals.map((d) => (
          <div key={d.title} className={\`rounded-booking bg-gradient-to-br \${d.color} p-6 text-white\`}>
            <Sparkles className="opacity-80" size={24} /><p className="mt-3 text-2xl font-bold">{d.discount}</p><p className="font-semibold">{d.title}</p><p className="mt-1 text-sm opacity-90">{d.desc}</p>
          </div>
        ))}</div>
      </section>
      <section className="page-container py-4">
        <div className="mb-6 flex items-end justify-between">
          <div><h2 className="text-2xl font-bold">Popular in Mahabaleshwar</h2><p className="text-slate-600">Properties guests love</p></div>
          <Link to="/hotels" className="btn-ghost">View all <ArrowRight size={16} /></Link>
        </div>
        <div className="space-y-4">{dummyHotels.slice(0, 3).map((h) => <PropertyCard key={h._id} item={h} linkPrefix="/hotels" />)}</motion></motion></div>
      </section>
      <section className="bg-white py-12">
        <div className="page-container">
          <h2 className="text-2xl font-bold">Explore destinations</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popularDestinations.map((d) => (
              <Link key={d.name} to="/hotels" className="group relative overflow-hidden rounded-booking">
                <img src={d.image} alt={d.name} className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white"><p className="text-lg font-bold">{d.name}</p><p className="text-sm opacity-90">{d.count}</p></motion></motion></div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="page-container py-12"><TrustBadges /></section>
    </div>
  );
}
`);

w('pages/public/HotelsPage.jsx', `import AccommodationListingPage from '../../components/listings/AccommodationListingPage';
import { dummyHotels } from '../../data/dummyListings';
export default function HotelsPage() {
  return (
    <AccommodationListingPage title="Mahabaleshwar: 450+ hotels" subtitle="Discover hotels with valley views, spas & strawberry breakfasts"
      apiQuery={{ type: 'HOTEL' }} fallbackData={dummyHotels} linkPrefix="/hotels" />
  );
}
`);

w('pages/public/ResortsPage.jsx', `import AccommodationListingPage from '../../components/listings/AccommodationListingPage';
import { dummyResorts } from '../../data/dummyListings';
export default function ResortsPage() {
  return (
    <AccommodationListingPage title="Luxury resorts in Mahabaleshwar" subtitle="Premium resorts with pools, spas & nature retreats"
      apiQuery={{ type: 'RESORT' }} fallbackData={dummyResorts} linkPrefix="/hotels" />
  );
}
`);

w('pages/public/HotelDetailPage.jsx', `import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Share2, Heart, Wifi, Car, Coffee, Waves } from 'lucide-react';
import api from '../../services/api';
import ImageGallery from '../../components/property/ImageGallery';
import ReviewScore from '../../components/property/ReviewScore';
import StickyReservation from '../../components/property/StickyReservation';
import RoomCard from '../../components/property/RoomCard';
import Skeleton from '../../components/ui/Skeleton';
import { dummyHotels } from '../../data/dummyListings';

const amenityIcons = { 'Free WiFi': Wifi, 'Free parking': Car, 'Breakfast included': Coffee, Pool: Waves };

export default function HotelDetailPage() {
  const { slug } = useParams();
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hotels/' + slug).then((r) => {
      setProperty(r.data.data?.hotel || r.data.data);
      setRooms(r.data.data?.rooms || []);
    }).catch(() => {
      const h = dummyHotels.find((x) => x.slug === slug) || dummyHotels[0];
      setProperty(h);
      setRooms(h.rooms || []);
    }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <motion></motion><div className="page-container py-8"><Skeleton className="h-[400px]" /></div>;
  if (!property) return <div className="page-container py-16 text-center">Property not found</div>;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'rooms', label: 'Rooms' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'policies', label: 'Policies' },
  ];

  return (
    <div className="bg-background pb-16">
      <div className="page-container py-4">
        <nav className="text-sm text-primary"><Link to="/">Home</Link> &gt; <Link to="/hotels">Hotels</Link> &gt; <span className="text-slate-600">{property.name}</span></nav>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{property.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-primary"><MapPin size={16} />{property.address?.line1 || property.address?.city} · <a href="#map" className="underline">Show on map</a></p>
          </div>
          <div className="flex items-center gap-3">
            <ReviewScore score={property.score || property.rating} label={property.scoreLabel} reviewCount={property.reviewCount} size="lg" />
            <button type="button" className="btn-ghost border border-border"><Share2 size={18} /></button>
            <button type="button" className="btn-ghost border border-border"><Heart size={18} /></button>
          </div>
        </div>
        <div className="mt-6"><ImageGallery images={property.images} name={property.name} /></div>
        <motion></motion>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <motion></motion>
          <div>
            <div className="flex gap-6 border-b border-border">
              {tabs.map((t) => (
                <button key={t.id} type="button" onClick={() => setTab(t.id)} className={\`pb-3 text-sm font-medium \${tab === t.id ? 'tab-active' : 'text-slate-500'}\`}>{t.label}</button>
              ))}
            </div>
            {tab === 'overview' && (
              <div className="mt-6 space-y-6">
                <p className="text-slate-700 leading-relaxed">{property.description}</p>
                <div>
                  <h3 className="font-bold">Most popular facilities</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {property.amenities?.map((a) => {
                      const Icon = amenityIcons[a] || Wifi;
                      return <span key={a} className="flex items-center gap-2 text-sm"><Icon size={18} className="text-primary" />{a}</span>;
                    })}
                  </div>
                </div>
              </div>
            )}
            {tab === 'rooms' && (
              <div className="mt-6 space-y-4">
                <h3 className="font-bold">Select your room</h3>
                {(rooms.length ? rooms : property.rooms || []).map((room) => (
                  <RoomCard key={room._id} room={room} selected={selectedRoom?._id === room._id} onSelect={setSelectedRoom} />
                ))}
              </div>
            )}
            {tab === 'reviews' && (
              <motion></motion>
              <div className="mt-6 card p-6">
                <ReviewScore score={property.score} label={property.scoreLabel} reviewCount={property.reviewCount} size="lg" />
                <p className="mt-4 text-slate-600">Guests loved the location, cleanliness and friendly staff. Sample reviews will load from API.</p>
              </div>
            )}
            {tab === 'policies' && (
              <div className="mt-6 card p-6 text-sm text-slate-600 space-y-2">
                <p><strong>Check-in:</strong> 2:00 PM · <strong>Check-out:</strong> 11:00 AM</p>
                <p>Free cancellation available on select room rates. GST 12% applicable.</p>
              </div>
            )}
          </div>
          <StickyReservation property={property} selectedRoom={selectedRoom} pricePerNight={property.priceFrom} />
        </div>
      </div>
    </div>
  );
}
`);

w('components/common/Navbar.jsx', `import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Globe, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/hotels', label: 'Stays' },
  { to: '/tents', label: 'Tents' },
  { to: '/guides', label: 'Guides' },
  { to: '/taxi', label: 'Taxi' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const dash = user?.role === 'SUPER_ADMIN' ? '/dashboard/admin' : user?.role?.includes('VENDOR') || ['HOTEL_VENDOR','TENT_OPERATOR','GUIDE','DRIVER'].includes(user?.role) ? '/dashboard/vendor' : '/dashboard/customer';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-primary text-white shadow-sm">
      <div className="page-container flex h-14 items-center justify-between lg:h-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-booking bg-accent text-lg font-black text-primary">Y</span>
          <span className="hidden font-bold sm:block">YOURMAHABALESHWAR<span className="font-normal text-blue-200">.com</span></span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => \`rounded-booking px-4 py-2 text-sm font-medium \${isActive ? 'bg-white/15' : 'hover:bg-white/10'}\`}>{l.label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/register" className="hidden rounded-booking border border-white/40 px-3 py-1.5 text-sm font-medium hover:bg-white/10 sm:block">List your property</Link>
          <button type="button" className="hidden rounded-booking p-2 hover:bg-white/10 sm:block" aria-label="Currency"><Globe size={18} /></button>
          <Link to="/faq" className="hidden rounded-booking p-2 hover:bg-white/10 sm:block" aria-label="Help"><HelpCircle size={18} /></Link>
          {isAuthenticated ? (
            <>
              <Link to={dash} className="hidden rounded-booking bg-white/10 px-3 py-1.5 text-sm font-medium sm:block">{user?.name?.split(' ')[0]}</Link>
              <button type="button" onClick={logout} className="hidden text-sm underline sm:block">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/register" className="hidden rounded-booking bg-white px-4 py-2 text-sm font-bold text-primary sm:block">Register</Link>
              <Link to="/login" className="rounded-booking border border-white px-4 py-2 text-sm font-semibold hover:bg-white/10">Sign in</Link>
            </>
          )}
          <button type="button" className="rounded-booking p-2 md:hidden" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
      {open && (
        <div className="border-t border-white/20 px-4 py-3 md:hidden">
          {links.map((l) => <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="block py-2.5 text-sm font-medium">{l.label}</NavLink>)}
        </div>
      )}
    </header>
  );
}
`);

w('components/common/Footer.jsx', `import { Link } from 'react-router-dom';

const cols = [
  { title: 'Support', links: [['Help Centre', '/faq'], ['Contact us', '/contact'], ['Cancellation', '/cancellation-policy']] },
  { title: 'Discover', links: [['Hotels', '/hotels'], ['Resorts', '/resorts'], ['Tents', '/tents'], ['Guides', '/guides']] },
  { title: 'Company', links: [['About', '/about-mahabaleshwar'], ['Blog', '/blogs'], ['Privacy', '/privacy-policy'], ['Terms', '/terms']] },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-primary text-white">
      <div className="page-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xl font-bold">YOURMAHABALESHWAR<span className="text-accent">.com</span></p>
          <p className="mt-3 text-sm text-blue-200">Book hotels, resorts, tents, guides & taxi in Mahabaleshwar with confidence.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="font-semibold">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-blue-200">
              {c.links.map(([label, to]) => <li key={to}><Link to={to} className="hover:text-white hover:underline">{label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/20 py-4 text-center text-xs text-blue-300">© 2026 YOURMAHABALESHWAR.COM · All rights reserved</div>
    </footer>
  );
}
`);

w('pages/public/TentsPage.jsx', `import { useEffect, useState } from 'react';
import PropertyCard from '../../components/property/PropertyCard';
import BookingSearchBar from '../../components/search/BookingSearchBar';
import Skeleton from '../../components/ui/Skeleton';
import api from '../../services/api';
import { dummyTents } from '../../data/dummyListings';

export default function TentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/tents').then((r) => setItems(r.data.data?.items || r.data.data || [])).catch(() => setItems(dummyTents)).finally(() => setLoading(false));
  }, []);
  return (
    <motion></motion>
    <div className="bg-background pb-16">
      <div className="bg-primary py-6 text-white"><div className="page-container"><BookingSearchBar compact /></div></div>
      <div className="page-container py-8">
        <h1 className="text-3xl font-bold">Glamping & tent stays</h1>
        <p className="mt-2 text-slate-600">{items.length} unique camps in Mahabaleshwar</p>
        <div className="mt-8 space-y-4">{loading ? <Skeleton className="h-52" /> : items.map((t) => <PropertyCard key={t._id} item={t} linkPrefix="/tents" priceKey="pricePerNight" priceSuffix="/ night" />)}</div>
      </div>
    </div>
  );
}
`);

w('pages/public/GuidesPage.jsx', `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Languages, Star } from 'lucide-react';
import BookingSearchBar from '../../components/search/BookingSearchBar';
import ReviewScore from '../../components/property/ReviewScore';
import api from '../../services/api';
import { dummyGuides } from '../../data/dummyListings';
import { formatCurrency } from '../../utils/format';

export default function GuidesPage() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/guides').then((r) => setItems(r.data.data?.items || [])).catch(() => setItems(dummyGuides)); }, []);
  return (
    <div className="bg-background pb-16">
      <div className="bg-primary py-6"><div className="page-container"><BookingSearchBar compact /></div></div>
      <div className="page-container py-8">
        <h1 className="text-3xl font-bold">Local tour guides</h1>
        <p className="mt-2 text-slate-600">6hr & 12hr packages · Bike add-on available</p>
        <motion></motion>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {items.map((g) => (
            <Link key={g._id} to={\`/guides/\${g.slug}\`} className="card flex gap-4 p-5 hover:shadow-elevated">
              <img src={g.photo || 'https://images.unsplash.com/photo-1507003211169?w=200'} alt="" className="h-24 w-24 rounded-booking object-cover" />
              <div className="flex-1">
                <div className="flex justify-between gap-2"><h3 className="font-bold text-primary">{g.name}</h3><ReviewScore score={g.score || g.rating} label={g.scoreLabel} size="sm" /></div>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><Languages size={14} />{g.languages?.join(', ')}</p>
                <p className="mt-2 text-sm">{g.specialties?.join(' · ')}</p>
                <p className="mt-2 font-bold">{formatCurrency(g.package6hr)} <span className="font-normal text-slate-500">/ 6 hours</span></p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
`);

w('pages/public/TaxiPage.jsx', `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropertyCard from '../../components/property/PropertyCard';
import BookingSearchBar from '../../components/search/BookingSearchBar';
import api from '../../services/api';
import { dummyDrivers } from '../../data/dummyListings';

export default function TaxiPage() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/drivers').then((r) => setItems(r.data.data?.items || [])).catch(() => setItems(dummyDrivers)); }, []);
  return (
    <div className="bg-background pb-16">
      <div className="bg-primary py-6"><motion></motion><motion></motion><div className="page-container"><BookingSearchBar compact /></div></motion></motion></div>
      <div className="page-container py-8">
        <h1 className="text-3xl font-bold">Taxi & cab booking</h1>
        <p className="mt-2 text-slate-600">Sedan, SUV, Innova · Per trip or hourly</p>
        <div className="mt-4 flex gap-3"><Link to="/driver-enquiry" className="btn-outline">Driver enquiry</Link><Link to="/hourly-enquiry" className="btn-secondary">Hourly booking</Link></div>
        <div className="mt-8 space-y-4">{items.map((d) => <PropertyCard key={d._id} item={{ ...d, name: d.name + ' · ' + d.vehicleType, priceFrom: d.perTripPrice }} linkPrefix="/taxi" priceSuffix="/ trip" />)}</div>
      </div>
    </div>
  );
}
`);

w('pages/public/SearchPage.jsx', `import { useSearchParams, Link } from 'react-router-dom';
import PropertyCard from '../../components/property/PropertyCard';
import BookingSearchBar from '../../components/search/BookingSearchBar';
import { dummyHotels } from '../../data/dummyListings';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || 'Mahabaleshwar';
  const results = dummyHotels.filter((h) => h.name.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes('mahabaleshwar'));

  return (
    <div className="bg-background pb-16">
      <div className="border-b border-border bg-primary py-6"><div className="page-container"><BookingSearchBar compact defaultDestination={q} /></div></div>
      <div className="page-container py-8">
        <h1 className="text-2xl font-bold">{results.length} properties in {q}</h1>
        <p className="text-slate-600">Best matches for your search</p>
        <div className="mt-8 space-y-4">{results.map((h) => <PropertyCard key={h._id} item={h} linkPrefix="/hotels" />)}</div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Link to="/tents" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">Browse tents</Link>
          <Link to="/guides" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">Find guides</Link>
          <Link to="/taxi" className="card p-4 text-center font-semibold text-primary hover:shadow-elevated">Book taxi</Link>
        </div>
      </div>
    </div>
  );
}
`);

w('pages/auth/LoginPage.jsx', `import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import BookingSearchBar from '../../components/search/BookingSearchBar';

const roleRedirect = { SUPER_ADMIN: '/dashboard/admin', OFFICE_STAFF_HOTEL: '/dashboard/admin', OFFICE_STAFF_GUIDE: '/dashboard/admin', HOTEL_VENDOR: '/dashboard/vendor', TENT_OPERATOR: '/dashboard/vendor', GUIDE: '/dashboard/vendor', DRIVER: '/dashboard/vendor', CUSTOMER: '/dashboard/customer' };

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || roleRedirect[user.role] || '/');
    } catch (e) { toast.error(e.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary py-8"><div className="page-container max-w-lg"><p className="text-white font-bold text-xl mb-4">Sign in to YOURMAHABALESHWAR.com</p></div></div>
      <div className="page-container flex justify-center py-12">
        <div className="card w-full max-w-md p-8">
          <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Access bookings, saved properties & rewards</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div><label className="text-sm font-medium">Email</label><input className="input-field mt-1" type="email" {...register('email', { required: true })} /></motion></motion></div>
            <div><label className="text-sm font-medium">Password</label><input className="input-field mt-1" type="password" {...register('password', { required: true })} /></div>
            <Link to="/forgot-password" className="block text-right text-sm text-primary hover:underline">Forgot password?</Link>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Signing in...' : 'Sign in'}</button>
          </form>
          <p className="mt-6 text-center text-sm">New here? <Link to="/register" className="font-bold text-primary">Create account</Link></p>
          <p className="mt-4 rounded-booking bg-blue-50 p-3 text-xs text-slate-600">Demo: admin@yourmahabaleshwar.com / Admin@123</p>
        </div>
      </div>
    </motion></motion></motion></div>
  );
}
`);

w('pages/public/TentDetailPage.jsx', `import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import ImageGallery from '../../components/property/ImageGallery';
import ReviewScore from '../../components/property/ReviewScore';
import StickyReservation from '../../components/property/StickyReservation';
import { dummyTents } from '../../data/dummyListings';

export default function TentDetailPage() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  useEffect(() => {
    api.get('/tents/' + slug).then((r) => setItem(r.data.data)).catch(() => setItem(dummyTents.find((t) => t.slug === slug) || dummyTents[0]));
  }, [slug]);
  if (!item) return null;
  return (
    <div className="page-container py-8">
      <h1 className="text-3xl font-bold">{item.name}</h1>
      <ReviewScore score={item.score} label={item.scoreLabel} reviewCount={item.reviewCount} className="mt-2" />
      <div className="mt-6"><ImageGallery images={item.images} name={item.name} /></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <p className="text-slate-700">{item.description || 'Premium glamping with valley views.'}</p>
        <StickyReservation property={item} pricePerNight={item.pricePerNight} />
      </div>
    </div>
  );
}
`);

w('layouts/PublicLayout.jsx', `import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export default function PublicLayout() {
  const { pathname } = useLocation();
  const hideBreadcrumb = ['/hotels', '/resorts', '/search'].some((p) => pathname.startsWith(p)) || pathname.includes('/hotels/');

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
`);

w('dashboards/customer/CustomerOverview.jsx', `import { Calendar, CreditCard, Heart, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import PropertyCard from '../../components/property/PropertyCard';
import { dummyHotels } from '../../data/dummyListings';

export default function CustomerOverview() {
  return (
    <div>
      <h2 className="text-xl font-bold">Welcome back</h2>
      <p className="text-slate-600">Manage trips, invoices & saved properties</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Calendar} label="Upcoming trips" value="2" color="primary" />
        <StatCard icon={CreditCard} label="Total spent" value="₹24,500" color="success" />
        <StatCard icon={Heart} label="Saved" value="5" color="accent" />
        <StatCard icon={TrendingUp} label="YMB Rewards" value="320 pts" color="primary" />
      </div>
      <div className="mt-10 flex items-center justify-between">
        <h3 className="font-bold">Recommended for you</h3>
        <Link to="/hotels" className="text-sm font-semibold text-primary">Browse stays</Link>
      </div>
      <div className="mt-4 space-y-4">{dummyHotels.slice(0, 2).map((h) => <PropertyCard key={h._id} item={h} linkPrefix="/hotels" />)}</div>
    </div>
  );
}
`);

console.log('UI batch 2 complete');
