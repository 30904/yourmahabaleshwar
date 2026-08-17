import { Shield, BadgeCheck, Headphones, CreditCard } from 'lucide-react';

const badges = [
  { icon: Shield, title: 'Secure booking', desc: '256-bit SSL encryption' },
  { icon: BadgeCheck, title: 'Verified properties', desc: 'Every listing is vetted' },
  { icon: Headphones, title: '24/7 support', desc: 'Local team in Mahabaleshwar' },
  { icon: CreditCard, title: 'Flexible payment', desc: 'Pay online or at property' },
];

export default function TrustBadges() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {badges.map((b) => (
        <div key={b.title} className="flex gap-3 rounded-booking border border-border bg-white p-4">
          <b.icon className="shrink-0 text-primary" size={28} />
          <div><p className="font-semibold text-slate-900">{b.title}</p><p className="text-xs text-slate-500">{b.desc}</p></div>
        </div>
      ))}
    </div>
  );
}
