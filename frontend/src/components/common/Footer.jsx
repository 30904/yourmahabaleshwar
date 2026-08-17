import { Link } from 'react-router-dom';
import Logo from './Logo';
import VentureCredits from './VentureCredits';

const cols = [
  { title: 'Support', links: [['Help Centre', '/faq'], ['Contact us', '/contact'], ['Cancellation', '/cancellation-policy']] },
  { title: 'Discover', links: [['Hotels', '/hotels'], ['Resorts', '/resorts'], ['Tents', '/tents'], ['Guides', '/guides']] },
  { title: 'Company', links: [['About', '/about-mahabaleshwar'], ['Blog', '/blogs'], ['Privacy', '/privacy-policy'], ['Terms', '/terms']] },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-white">
      <div className="page-container py-10">
        <VentureCredits />
      </div>
      <div className="page-container grid gap-10 border-t border-border py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo variant="footer" />
          <p className="mt-4 max-w-xs text-sm text-slate-600">
            Discover · Book · Experience Mahabaleshwar — hotels, resorts, tents, guides and taxi.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="font-semibold text-slate-900">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {c.links.map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="hover:text-primary hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border bg-primary py-4">
        <div className="page-container text-center">
          <p className="text-xs text-blue-200">© 2026 YOURMAHABALESHWAR.COM · All rights reserved</p>
          <VentureCredits compact />
        </div>
      </div>
    </footer>
  );
}
