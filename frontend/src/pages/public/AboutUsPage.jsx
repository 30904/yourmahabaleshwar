import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Hotel,
  Trees,
  Home,
  Compass,
  Car,
  Tent,
  UserRound,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import Seo from '../../components/seo/Seo';
import { CONTACT_EMAIL } from '../../constants/site';

const reasons = [
  {
    title: 'Everything in One Place',
    text: 'From luxury resorts to local taxi services, we provide a unified booking experience.',
  },
  {
    title: 'Complete Transparency',
    text: 'No hidden costs, fair pricing, and expert local guidance.',
  },
  {
    title: 'Safety First',
    text: 'We guarantee certified and verified services for your peace of mind.',
  },
  {
    title: 'Time & Cost Effective',
    text: 'We handle the logistics so you can focus on enjoying your holiday.',
  },
];

const services = [
  { label: 'Hotel Booking', to: '/hotels', icon: Hotel },
  { label: 'Resort Booking', to: '/resorts', icon: Trees },
  { label: 'Homestay Booking', to: '/homestays', icon: Home },
  { label: 'Professional Guides', to: '/guides', icon: Compass },
  { label: 'Taxi & Sightseeing', to: '/taxi', icon: Car },
  { label: 'Tent & Camping', to: '/tents', icon: Tent },
  { label: 'Horse Riding', to: '/horses', icon: Trees },
  { label: 'Driver Services', to: '/drivers', icon: UserRound },
];

const SUPPORT_PHONE = '+91 98765 43210';
const SUPPORT_PHONE_HREF = 'tel:+919876543210';

export default function AboutUsPage() {
  return (
    <div className="bg-background pb-16">
      <Seo
        title="About Us"
        description="Sakharam Laxman Mane — 40 years of trust, experience, and hospitality in Mahabaleshwar. Discover, book, and experience with Your Mahabaleshwar."
      />

      <div className="bg-primary py-12 text-white">
        <div className="page-container">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">About us</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">40 Years of Trust, Experience, and Hospitality</h1>
          <p className="mt-3 max-w-2xl text-blue-100">
            Serving tourists in Mahabaleshwar with authentic, seamless travel — free from hassle or exploitation.
          </p>
        </div>
      </div>

      <div className="page-container space-y-12 py-10 sm:py-14">
        <section className="grid items-start gap-8 lg:grid-cols-[220px_1fr]">
          <div className="mx-auto flex w-full max-w-[220px] flex-col items-center text-center lg:mx-0">
            <div
              className="flex h-48 w-48 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-slate-800 text-5xl font-bold text-white shadow-md"
              aria-hidden
            >
              SM
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900">Sakharam Laxman Mane</p>
            <p className="mt-1 text-sm text-slate-500">Founder · SM Enterprise</p>
          </div>

          <div className="space-y-4 text-slate-600">
            <h2 className="text-2xl font-bold text-slate-900">A trusted companion for every visitor</h2>
            <p>
              For the past 40 years, I have been dedicated to serving tourists in Mahabaleshwar. My journey began as a
              local guide, but over the decades, I have become a trusted companion for visitors seeking the true essence
              of this hill station.
            </p>
            <p>
              My mission is simple: to ensure your trip is authentic, seamless, and completely free from any hassle or
              exploitation.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">Why Choose Us?</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {reasons.map((item) => (
              <div key={item.title} className="flex gap-3 rounded-xl border border-border bg-white p-5">
                <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={22} />
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">Our Comprehensive Services</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ label, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 text-sm font-medium text-slate-800 transition hover:border-primary hover:text-primary"
              >
                <Icon size={18} className="shrink-0 text-primary" />
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-primary px-6 py-8 text-white sm:px-10">
          <h2 className="text-2xl font-bold text-white">Plan Your Perfect Mahabaleshwar Getaway Today!</h2>
          <p className="mt-2 max-w-2xl text-blue-100">
            Reach out anytime — we are here to help you discover, book, and experience Mahabaleshwar with confidence.
          </p>
          <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-6">
            <a href={SUPPORT_PHONE_HREF} className="inline-flex items-center gap-2 hover:underline">
              <Phone size={16} /> {SUPPORT_PHONE}
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 hover:underline">
              <Mail size={16} /> {CONTACT_EMAIL}
            </a>
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} /> Mahabaleshwar, Maharashtra
            </span>
          </div>
          <div className="mt-6">
            <Link
              to="/contact"
              className="inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary hover:bg-blue-50"
            >
              Contact us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
