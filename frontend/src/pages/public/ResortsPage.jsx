import AccommodationListingPage from '../../components/listings/AccommodationListingPage';
import { dummyResorts } from '../../data/dummyListings';
export default function ResortsPage() {
  return (
    <AccommodationListingPage title="Luxury resorts in Mahabaleshwar" subtitle="Premium resorts with pools, spas & nature retreats"
      apiQuery={{ type: 'RESORT' }} fallbackData={dummyResorts} linkPrefix="/resorts" />
  );
}
