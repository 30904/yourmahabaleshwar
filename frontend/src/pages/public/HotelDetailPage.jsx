import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Share2, Heart, Wifi, Car, Coffee, Waves } from 'lucide-react';
import ImageGallery from '../../components/property/ImageGallery';
import ReviewScore from '../../components/property/ReviewScore';
import StickyReservation from '../../components/property/StickyReservation';
import RoomCard from '../../components/property/RoomCard';
import HotelBookingForm from '../../components/booking/HotelBookingForm';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { fetchHotelBySlug } from '../../services/listingsApi';
import { dummyHotels } from '../../data/dummyListings';
import { normalizeHotel } from '../../utils/listingHelpers';
import Seo from '../../components/seo/Seo';
import { firstImageUrl, truncateMeta } from '../../constants/seo';

const amenityIcons = { WiFi: Wifi, 'Free WiFi': Wifi, Parking: Car, 'Free parking': Car, Breakfast: Coffee, Pool: Waves };

export default function HotelDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotelBySlug(slug)
      .then(({ hotel, rooms: r }) => {
        setProperty(hotel);
        setRooms(r);
      })
      .catch(() => {
        const h = dummyHotels.find((x) => x.slug === slug) || dummyHotels[0];
        setProperty(normalizeHotel(h));
        setRooms(h.rooms || []);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="page-container py-8"><Skeleton className="h-[400px]" /></div>;
  if (!property) return <div className="page-container py-16 text-center">Property not found</div>;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'rooms', label: 'Rooms' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'policies', label: 'Policies' },
  ];

  return (
    <div className="bg-background pb-16">
      <Seo
        title={property.name}
        description={truncateMeta(property.description || `${property.name} — hotel in Mahabaleshwar. Book on YOURMAHABALESHWAR.COM.`)}
        image={firstImageUrl(property.images) || '/logo.png'}
        type="article"
      />
      <div className="page-container py-4">
        <nav className="text-sm text-primary">
          <Link to="/">Home</Link> &gt; <Link to="/hotels">Hotels</Link> &gt;{' '}
          <span className="text-slate-600">{property.name}</span>
        </nav>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{property.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-primary">
              <MapPin size={16} />
              {property.address?.line1 || property.address?.city} ·{' '}
              <a href="#map" className="underline">Show on map</a>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ReviewScore score={property.score || property.rating} label={property.scoreLabel} reviewCount={property.reviewCount} size="lg" />
            <button type="button" className="btn-ghost border border-border"><Share2 size={18} /></button>
            <button type="button" className="btn-ghost border border-border"><Heart size={18} /></button>
          </div>
        </div>
        <div className="mt-6"><ImageGallery images={property.images} name={property.name} /></div>
        
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex gap-6 border-b border-border">
              {tabs.map((t) => (
                <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`pb-3 text-sm font-medium ${tab === t.id ? 'tab-active' : 'text-slate-500'}`}>{t.label}</button>
              ))}
            </div>
            {tab === 'overview' && (
              <div className="mt-6 space-y-6">
                <p className="leading-relaxed text-slate-700">{property.description}</p>
                <div>
                  <h3 className="font-bold">Most popular facilities</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {property.amenities?.map((a) => {
                      const Icon = amenityIcons[a] || Wifi;
                      return (
                        <span key={a} className="flex items-center gap-2 text-sm">
                          <Icon size={18} className="text-primary" />
                          {a}
                        </span>
                      );
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
              <div className="mt-6 card p-6">
                <ReviewScore score={property.score} label={property.scoreLabel} reviewCount={property.reviewCount} size="lg" />
                <p className="mt-4 text-slate-600">Guests loved the location, cleanliness and friendly staff.</p>
              </div>
            )}
            {tab === 'policies' && (
              <div className="mt-6 card space-y-2 p-6 text-sm text-slate-600">
                <p><strong>Check-in:</strong> {property.checkInTime || '14:00'} · <strong>Check-out:</strong> {property.checkOutTime || '11:00'}</p>
                <p>Free cancellation available on select room rates. GST 12% applicable.</p>
              </div>
            )}
          </div>
          <div>
            {selectedRoom && isAuthenticated ? (
              <HotelBookingForm hotelId={property._id} room={selectedRoom} />
            ) : (
              <StickyReservation property={property} selectedRoom={selectedRoom} pricePerNight={property.priceFrom} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}