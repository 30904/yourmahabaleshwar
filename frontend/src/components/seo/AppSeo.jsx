import { useLocation } from 'react-router-dom';
import { SITE_NAME, SITE_URL } from '../../constants/site';
import { DEFAULT_DESCRIPTION, resolveRouteSeo } from '../../constants/seo';
import Seo from './Seo';

/** Applies route-level SEO for every page; detail pages can override with <Seo />. */
export default function AppSeo() {
  const { pathname } = useLocation();
  const meta = resolveRouteSeo(pathname);

  const jsonLd =
    pathname === '/'
      ? {
          '@context': 'https://schema.org',
          '@type': 'TravelAgency',
          name: SITE_NAME,
          url: SITE_URL,
          description: DEFAULT_DESCRIPTION,
          logo: `${SITE_URL}/logo.png`,
          areaServed: 'Mahabaleshwar, Maharashtra, India',
        }
      : undefined;

  return (
    <Seo
      title={meta.title}
      description={meta.description}
      path={pathname}
      noIndex={meta.noIndex}
      image="/logo.png"
      jsonLd={jsonLd}
    />
  );
}
