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
  Zap,
  Shirt,
  Flame,
} from 'lucide-react';

const ICON_MAP = {
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
  Zap,
  Shirt,
  Flame,
};

export const AMENITY_ICON_OPTIONS = Object.keys(ICON_MAP);

export function getAmenityIcon(iconName) {
  return ICON_MAP[iconName] || Sparkles;
}
