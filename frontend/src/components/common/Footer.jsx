import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';
import VentureCredits from './VentureCredits';

export default function Footer() {
  const { t } = useTranslation();

  const cols = [
    {
      titleKey: 'footer.support',
      links: [
        ['footer.helpCentre', '/faq'],
        ['footer.contactUs', '/contact'],
        ['footer.cancellation', '/cancellation-policy'],
      ],
    },
    {
      titleKey: 'footer.discover',
      links: [
        ['home.categories.hotels', '/hotels'],
        ['home.categories.resorts', '/resorts'],
        ['home.categories.tents', '/tents'],
        ['nav.guides', '/guides'],
      ],
    },
    {
      titleKey: 'footer.company',
      links: [
        ['footer.about', '/about-mahabaleshwar'],
        ['footer.blog', '/blogs'],
        ['footer.privacy', '/privacy-policy'],
        ['footer.terms', '/terms'],
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-border bg-white">
      <div className="page-container py-10">
        <VentureCredits />
      </div>
      <div className="page-container grid gap-10 border-t border-border py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo variant="footer" />
          <p className="mt-4 max-w-xs text-sm text-slate-600">{t('footer.tagline')}</p>
        </div>
        {cols.map((c) => (
          <div key={c.titleKey}>
            <p className="font-semibold text-slate-900">{t(c.titleKey)}</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {c.links.map(([labelKey, to]) => (
                <li key={to}>
                  <Link to={to} className="hover:text-primary hover:underline">
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border bg-primary py-4">
        <div className="page-container text-center">
          <p className="text-xs text-blue-200">{t('footer.copyright')}</p>
          <VentureCredits compact />
        </div>
      </div>
    </footer>
  );
}
