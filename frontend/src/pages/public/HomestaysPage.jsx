import AccommodationListingPage from '../../components/listings/AccommodationListingPage';
import { HOMESTAY_VILLA } from '../../constants/homestayVillaLabels';

export default function HomestaysPage() {
  return (
    <AccommodationListingPage
      title={`Mahabaleshwar: ${HOMESTAY_VILLA.plural}`}
      subtitle={`Discover local ${HOMESTAY_VILLA.pluralLower} with homely stays & valley views`}
      type="HOMESTAY"
      linkPrefix="/homestays"
      priceKey="priceFrom"
      itemType="HOMESTAY"
      fallbackData={[]}
    />
  );
}
