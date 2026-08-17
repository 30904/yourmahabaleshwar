import {
  Wifi,
  Car,
  Waves,
  UtensilsCrossed,
  Wind,
  Tv,
  Coffee,
  Dumbbell,
  Sparkles,
  Shield,
  PawPrint,
  Cigarette,
  Bell,
  Mountain,
  TreePine,
  Building2,
  MapPin,
  ClipboardList,
  BedDouble,
  Images,
  Rocket,
} from 'lucide-react';

export const FORM_STEPS = [
  { id: 'basics', label: 'Property basics', desc: 'Name, type & description', icon: Building2 },
  { id: 'location', label: 'Location', desc: 'Address & map pin', icon: MapPin },
  { id: 'amenities', label: 'Amenities & policies', desc: 'Facilities & house rules', icon: ClipboardList },
  { id: 'rooms', label: 'Rooms & pricing', desc: 'Room types & rates', icon: BedDouble },
  { id: 'photos', label: 'Photos', desc: 'Gallery & cover image', icon: Images },
  { id: 'publish', label: 'Publish', desc: 'SEO & go live', icon: Rocket },
];

export const AMENITY_OPTIONS = [
  { id: 'Free WiFi', icon: Wifi },
  { id: 'Parking', icon: Car },
  { id: 'Swimming Pool', icon: Waves },
  { id: 'Restaurant', icon: UtensilsCrossed },
  { id: 'AC', icon: Wind },
  { id: 'TV', icon: Tv },
  { id: 'Breakfast', icon: Coffee },
  { id: 'Gym', icon: Dumbbell },
  { id: 'Spa', icon: Sparkles },
  { id: '24/7 Security', icon: Shield },
  { id: 'Pet Friendly', icon: PawPrint },
  { id: 'Smoking Area', icon: Cigarette },
  { id: 'Room Service', icon: Bell },
  { id: 'Mountain View', icon: Mountain },
  { id: 'Garden', icon: TreePine },
];

export const ROOM_TYPES = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'DELUXE', label: 'Deluxe' },
  { value: 'SUITE', label: 'Suite' },
  { value: 'FAMILY', label: 'Family' },
];

export const PROPERTY_TYPES = [
  { value: 'HOTEL', label: 'Hotel', desc: 'City hotel or business stay' },
  { value: 'RESORT', label: 'Resort', desc: 'Leisure resort with amenities' },
];
