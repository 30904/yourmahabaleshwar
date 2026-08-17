import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SITE_NAME, SITE_URL } from '../../constants/site';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  TWITTER_HANDLE,
  absoluteAssetUrl,
  truncateMeta,
} from '../../constants/seo';

/**
 * Per-page SEO + Open Graph / Twitter cards for social sharing.
 * Uses absolute logo URL by default so WhatsApp/Facebook show the brand image.
 */
export default function Seo({
  title,
  description,
  image,
  path,
  type = 'website',
  noIndex = false,
  jsonLd,
}) {
  const { pathname } = useLocation();
  const pagePath = path ?? pathname ?? '/';
  const canonical = `${SITE_URL}${pagePath === '/' ? '/' : pagePath.replace(/\/$/, '') || '/'}`;
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | ${DEFAULT_TITLE}`;
  const desc = truncateMeta(description || DEFAULT_DESCRIPTION);
  const ogImage = absoluteAssetUrl(image) || DEFAULT_OG_IMAGE;

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en" />
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:alt" content={`${SITE_NAME} logo`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={`${SITE_NAME} logo`} />

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
}
