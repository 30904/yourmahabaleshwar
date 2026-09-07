import AccommodationListingPage from '../../components/listings/AccommodationListingPage';

export default function TentsPage() {
  return (
    <AccommodationListingPage
      title="Mahabaleshwar: Tent stays & glamping"
      subtitle="Discover camps, glamping and tent stays in nature"
      type="TENT"
      linkPrefix="/tents"
      priceKey="pricePerNight"
      itemType="TENT"
      fallbackData={[]}
    />
  );
}
