import { Shield, BadgeCheck, Headphones, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const badges = [
  { icon: Shield, titleKey: 'trust.secureTitle', descKey: 'trust.secureDesc' },
  { icon: BadgeCheck, titleKey: 'trust.verifiedTitle', descKey: 'trust.verifiedDesc' },
  { icon: Headphones, titleKey: 'trust.supportTitle', descKey: 'trust.supportDesc' },
  { icon: CreditCard, titleKey: 'trust.paymentTitle', descKey: 'trust.paymentDesc' },
];

export default function TrustBadges() {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {badges.map((b) => (
        <div key={b.titleKey} className="flex gap-3 rounded-booking border border-border bg-white p-4">
          <b.icon className="shrink-0 text-primary" size={28} />
          <div>
            <p className="font-semibold text-slate-900">{t(b.titleKey)}</p>
            <p className="text-xs text-slate-500">{t(b.descKey)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
