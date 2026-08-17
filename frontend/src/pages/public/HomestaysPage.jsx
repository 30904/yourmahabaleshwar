import { useEffect, useState } from 'react';
import PropertyCard from '../../components/property/PropertyCard';
import BookingSearchBar from '../../components/search/BookingSearchBar';
import Skeleton from '../../components/ui/Skeleton';
import { fetchHomestays } from '../../services/listingsApi';

export default function HomestaysPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchHomestays({ limit: 50 }).then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);
  return (
    <div className="bg-background pb-16">
      <div className="bg-primary py-6 text-white"><div className="page-container"><BookingSearchBar compact /></div></div>
      <div className="page-container py-8">
        <h1 className="text-3xl font-bold">Homestays</h1>
        <p className="mt-2 text-slate-600">{items.length} local homes in Mahabaleshwar</p>
        <div className="mt-8 space-y-4">
          {loading ? <Skeleton className="h-52" /> : items.map((t) => (
            <PropertyCard key={t._id} item={t} linkPrefix="/homestays" priceKey="priceFrom" priceSuffix="/ night" itemType="HOMESTAY" />
          ))}
        </div>
      </div>
    </div>
  );
}
