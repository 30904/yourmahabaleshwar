import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropertyCard from '../../components/property/PropertyCard';
import BookingSearchBar from '../../components/search/BookingSearchBar';
import { fetchDrivers } from '../../services/listingsApi';
import { dummyDrivers } from '../../data/dummyListings';
import { normalizeDriver } from '../../utils/listingHelpers';

export default function TaxiPage() {
  const [items, setItems] = useState([]);
  useEffect(() => { fetchDrivers({ limit: 50 }).then(setItems).catch(() => setItems(dummyDrivers.map(normalizeDriver))); }, []);
  return (
    <div className="bg-background pb-16">
      <div className="bg-primary py-6"><div className="page-container"><BookingSearchBar compact /></div></div>
      <div className="page-container py-8">
        <h1 className="text-3xl font-bold">Taxi & cab booking</h1>
        <p className="mt-2 text-slate-600">Sedan, SUV, Innova · Per trip or hourly</p>
        <div className="mt-4 flex gap-3"><Link to="/driver-enquiry" className="btn-outline">Driver enquiry</Link><Link to="/hourly-enquiry" className="btn-secondary">Hourly booking</Link></div>
        <div className="mt-8 space-y-4">{items.map((d) => <PropertyCard key={d._id} item={{ ...d, name: d.name + ' · ' + d.vehicleType, priceFrom: d.perTripPrice }} linkPrefix="/taxi" priceSuffix="/ trip" />)}</div>
      </div>
    </div>
  );
}
