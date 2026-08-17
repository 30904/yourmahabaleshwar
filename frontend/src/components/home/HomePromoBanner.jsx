import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';

export default function HomePromoBanner() {
  return (
    <section className="page-container py-4">
      <div className="home-promo-banner">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-400/20">
              <Gift size={24} className="text-amber-300" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-200">Member perks</p>
              <h3 className="text-lg font-bold text-white sm:text-xl">
                Sign in to unlock exclusive deals & free upgrades
              </h3>
              <p className="mt-1 text-sm text-blue-100">
                Create a free account — save properties, faster checkout, and seasonal discounts.
              </p>
            </div>
          </div>
          <Link to="/register-vendor" className="home-promo-btn shrink-0">
            Join free
          </Link>
        </div>
      </div>
    </section>
  );
}
