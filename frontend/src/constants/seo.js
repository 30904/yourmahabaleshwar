import { SITE_NAME, SITE_URL } from './site';

export const DEFAULT_TITLE = 'Tourism Marketplace';
export const DEFAULT_DESCRIPTION =
  'Book hotels, resorts, homestays, tents, guides, taxi, horse rides, strawberries & Mapro products in Mahabaleshwar — YOURMAHABALESHWAR.COM';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;
export const TWITTER_HANDLE = '@yourmahabaleshwar';

/** Static route SEO (first match wins). Detail pages override via <Seo />. */
export const ROUTE_SEO = [
  {
    test: /^\/$/,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  {
    test: /^\/hotels\/[^/]+$/,
    title: 'Hotel in Mahabaleshwar',
    description: 'View hotel details, rooms, and book your stay in Mahabaleshwar on YOURMAHABALESHWAR.COM.',
  },
  {
    test: /^\/hotels/,
    title: 'Hotels in Mahabaleshwar',
    description: 'Discover hotels with valley views, spas & strawberry breakfasts. Book stays in Mahabaleshwar online.',
  },
  {
    test: /^\/resorts/,
    title: 'Resorts in Mahabaleshwar',
    description: 'Browse resorts and leisure stays in Mahabaleshwar. Compare prices and book with confidence.',
  },
  {
    test: /^\/homestays\/[^/]+$/,
    title: 'Homestay in Mahabaleshwar',
    description: 'Homestay details and booking in Mahabaleshwar — local hospitality on YOURMAHABALESHWAR.COM.',
  },
  {
    test: /^\/homestays/,
    title: 'Homestays in Mahabaleshwar',
    description: 'Authentic Mahabaleshwar homestays. Stay with local hosts and explore the hills.',
  },
  {
    test: /^\/tents\/[^/]+$/,
    title: 'Camping & Tent Stay',
    description: 'Glamping and tent stay details in Mahabaleshwar. Book your outdoor experience.',
  },
  {
    test: /^\/tents/,
    title: 'Tents & Camping in Mahabaleshwar',
    description: 'Book tent stays and camping experiences with valley views in Mahabaleshwar.',
  },
  {
    test: /^\/guides\/[^/]+$/,
    title: 'Local Guide',
    description: 'Book a local Mahabaleshwar guide for sightseeing, treks, and sightseeing tours.',
  },
  {
    test: /^\/guides/,
    title: 'Tour Guides in Mahabaleshwar',
    description: 'Hire verified local guides for viewpoints, treks, and custom Mahabaleshwar tours.',
  },
  {
    test: /^\/drivers\/[^/]+$/,
    title: 'Driver',
    description: 'Book a local driver for transfers and sightseeing in Mahabaleshwar.',
  },
  {
    test: /^\/drivers/,
    title: 'Drivers in Mahabaleshwar',
    description: 'Reliable local drivers for sightseeing and transfers in Mahabaleshwar.',
  },
  {
    test: /^\/taxi\/[^/]+$/,
    title: 'Taxi & Driver',
    description: 'Book a local taxi or driver for transfers and sightseeing in Mahabaleshwar.',
  },
  {
    test: /^\/taxi/,
    title: 'Taxi & Drivers in Mahabaleshwar',
    description: 'Reliable local taxi and driver services for sightseeing and transfers in Mahabaleshwar.',
  },
  {
    test: /^\/horses\/[^/]+$/,
    title: 'Horse Ride',
    description: 'Horse ride details and booking in Mahabaleshwar on YOURMAHABALESHWAR.COM.',
  },
  {
    test: /^\/horses/,
    title: 'Horse Rides in Mahabaleshwar',
    description: 'Book scenic horse rides and trail experiences in Mahabaleshwar.',
  },
  {
    test: /^\/strawberries\/[^/]+$/,
    title: 'Strawberry Product',
    description: 'Fresh Mahabaleshwar strawberry products — order on YOURMAHABALESHWAR.COM.',
  },
  {
    test: /^\/strawberries/,
    title: 'Strawberries from Mahabaleshwar',
    description: 'Order fresh strawberries and farm products from Mahabaleshwar.',
  },
  {
    test: /^\/mapro\/[^/]+$/,
    title: 'Mapro Product',
    description: 'Mapro and local specialty products from Mahabaleshwar.',
  },
  {
    test: /^\/mapro/,
    title: 'Mapro Products',
    description: 'Shop Mapro jams, syrups, and Mahabaleshwar specialties online.',
  },
  {
    test: /^\/combos\/[^/]+$/,
    title: 'Combo Offer',
    description: 'Stay + experience combo deal in Mahabaleshwar. Book a package online.',
  },
  {
    test: /^\/combos/,
    title: 'Combo Offers',
    description: 'Save with Mahabaleshwar combo packages — stays, experiences, and local products.',
  },
  {
    test: /^\/search/,
    title: 'Search',
    description: 'Search hotels, stays, guides, taxi, and experiences in Mahabaleshwar.',
  },
  {
    test: /^\/contact/,
    title: 'Contact Us',
    description: 'Contact YOURMAHABALESHWAR.COM for bookings, partnerships, and support.',
  },
  {
    test: /^\/faq/,
    title: 'FAQ',
    description: 'Frequently asked questions about bookings, payments, and stays in Mahabaleshwar.',
  },
  {
    test: /^\/blogs/,
    title: 'Travel Blog',
    description: 'Travel tips, viewpoints, and guides for visiting Mahabaleshwar.',
  },
  {
    test: /^\/about-mahabaleshwar/,
    title: 'About Mahabaleshwar',
    description: 'Learn about Mahabaleshwar — strawberries, viewpoints, and hill-station travel.',
  },
  {
    test: /^\/privacy-policy/,
    title: 'Privacy Policy',
    description: 'How YOURMAHABALESHWAR.COM collects, uses, and protects your personal data.',
  },
  {
    test: /^\/terms/,
    title: 'Terms & Conditions',
    description: 'Terms of use and booking conditions for YOURMAHABALESHWAR.COM.',
  },
  {
    test: /^\/cancellation-policy/,
    title: 'Cancellation Policy',
    description: 'Cancellation and refund guidelines for bookings on YOURMAHABALESHWAR.COM.',
  },
  {
    test: /^\/driver-enquiry/,
    title: 'Driver Enquiry',
    description: 'Enquire for a private driver in Mahabaleshwar.',
  },
  {
    test: /^\/hourly-enquiry/,
    title: 'Hourly Taxi Enquiry',
    description: 'Enquire for hourly taxi packages in Mahabaleshwar.',
  },
  {
    test: /^\/login/,
    title: 'Sign In',
    description: `Sign in to your ${SITE_NAME} account to manage bookings and favorites.`,
  },
  {
    test: /^\/register-vendor/,
    title: 'Vendor Registration',
    description: 'List your hotel, stay, guide, taxi, or products on YOURMAHABALESHWAR.COM.',
  },
  {
    test: /^\/register/,
    title: 'Create Account',
    description: `Create a ${SITE_NAME} customer account to book stays and experiences.`,
  },
  {
    test: /^\/forgot-password/,
    title: 'Forgot Password',
    description: 'Reset your YOURMAHABALESHWAR.COM account password.',
  },
];

export function resolveRouteSeo(pathname) {
  const path = pathname || '/';
  const isPrivate = path.startsWith('/admin') || path.startsWith('/dashboard');
  if (isPrivate) {
    return {
      title: 'Dashboard',
      description: DEFAULT_DESCRIPTION,
      noIndex: true,
    };
  }
  const hit = ROUTE_SEO.find((r) => r.test.test(path));
  return {
    title: hit?.title || DEFAULT_TITLE,
    description: hit?.description || DEFAULT_DESCRIPTION,
    noIndex: false,
  };
}

export function absoluteAssetUrl(pathOrUrl) {
  if (!pathOrUrl) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path}`;
}

export function firstImageUrl(images) {
  if (!images?.length) return null;
  const first = images[0];
  if (typeof first === 'string') return first;
  return first?.url || first?.src || null;
}

export function truncateMeta(text, max = 160) {
  if (!text) return DEFAULT_DESCRIPTION;
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}
