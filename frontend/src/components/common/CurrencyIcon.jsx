import { IndianRupee } from 'lucide-react';

/** Lucide INR icon for KPI / money surfaces (never use DollarSign). */
export default function CurrencyIcon({ size = 20, className, ...props }) {
  return <IndianRupee size={size} className={className} aria-hidden {...props} />;
}
