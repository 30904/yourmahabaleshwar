import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropertyCard from '../../components/property/PropertyCard';
import BookingSearchBar from '../../components/search/BookingSearchBar';
import { fetchDrivers } from '../../services/listingsApi';
import { dummyDrivers } from '../../data/dummyListings';
import { normalizeDriver } from '../../utils/listingHelpers';

export default function DriversPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetchDrivers({ limit: 50, vendorType: 'DRIVER' })
      .then(setItems)
      .catch(() => setItems(dummyDrivers.map(normalizeDriver)));
  }, []);

  return (
    <div className="bg-background pb-16">
      <div className="bg-primary py-6">
        <div className="page-container">
          <BookingSearchBar compact />
        </div>
      </div>
      <div className="page-container py-8">
        <h1 className="text-3xl font-bold">Drivers in Mahabaleshwar</h1>
        <p className="mt-2 text-slate-600">Individual driver partners for sightseeing and local trips</p>
        <div className="mt-8 space-y-4">
          {items.map((d) => (
            <PropertyCard
              key={d._id}
              item={{ ...d, name: d.name + ' · ' + d.vehicleType, priceFrom: d.perTripPrice }}
              linkPrefix="/drivers"
              priceSuffix="/ trip"
            />
          ))}
        </div>
        {items.length === 0 && (
          <p className="mt-6 text-slate-500">
            No driver partners listed yet.{' '}
            <Link to="/driver-enquiry" className="text-primary underline">
              Send an enquiry
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
