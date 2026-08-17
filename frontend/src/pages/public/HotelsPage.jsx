import AccommodationListingPage from '../../components/listings/AccommodationListingPage';
import { dummyHotels } from '../../data/dummyListings';
export default function HotelsPage() {
  return (
    <AccommodationListingPage title="Mahabaleshwar: 450+ hotels" subtitle="Discover hotels with valley views, spas & strawberry breakfasts"
      apiQuery={{ type: 'HOTEL' }} fallbackData={dummyHotels} linkPrefix="/hotels" />
  );
}
