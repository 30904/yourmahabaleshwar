import PlatformSettings from '../models/PlatformSettings.js';

export const DEAL_LINKS = ['/hotels', '/resorts', '/homestays', '/tents', '/guides', '/taxi', '/drivers', '/horses'];
export const DEAL_TONES = ['blue', 'green', 'orange'];

const DEFAULT_DEALS = [
  {
    discount: '30% off',
    title: 'Monsoon Escape',
    description: 'Book before June 30',
    discountMr: '३०% सवलत',
    titleMr: 'मान्सून एस्केप',
    descriptionMr: '३० जूनपूर्वी बुक करा',
    link: '/hotels',
    tone: 'blue',
    order: 1,
    isActive: true,
  },
  {
    discount: 'Free breakfast',
    title: 'Weekend Getaway',
    description: '2+ night stays',
    discountMr: 'मोफत नाश्ता',
    titleMr: 'वीकेंड गेटवे',
    descriptionMr: '२+ रात्री राहणे',
    link: '/hotels',
    tone: 'green',
    order: 2,
    isActive: true,
  },
  {
    discount: '15% off',
    title: 'Early Bird',
    description: 'Book 14 days ahead',
    discountMr: '१५% सवलत',
    titleMr: 'अर्ली बर्ड',
    descriptionMr: '१४ दिवस आधी बुक करा',
    link: '/hotels',
    tone: 'orange',
    order: 3,
    isActive: true,
  },
];

async function settingsDoc() {
  let settings = await PlatformSettings.findOne({ key: 'default' });
  if (!settings) settings = await PlatformSettings.create({ key: 'default' });
  return settings;
}

export async function ensureHomepageDealsSeeded() {
  const settings = await settingsDoc();
  if (settings.homepageDealsSeeded) return settings;
  if (!settings.homepageDeals?.length) {
    settings.homepageDeals = DEFAULT_DEALS;
  }
  settings.homepageDealsSeeded = true;
  await settings.save();
  return settings;
}

export function normalizeDeal(body) {
  const discount = String(body?.discount || '').trim();
  const title = String(body?.title || '').trim();
  if (!discount || !title) {
    const err = new Error('Discount and title are required');
    err.statusCode = 400;
    throw err;
  }
  const link = DEAL_LINKS.includes(body?.link) ? body.link : '/hotels';
  const tone = DEAL_TONES.includes(body?.tone) ? body.tone : 'blue';
  return {
    discount,
    title,
    description: String(body?.description || '').trim(),
    discountMr: String(body?.discountMr || '').trim(),
    titleMr: String(body?.titleMr || '').trim(),
    descriptionMr: String(body?.descriptionMr || '').trim(),
    link,
    tone,
    order: Number.isFinite(Number(body?.order)) ? Number(body.order) : 0,
    isActive: body?.isActive !== false && body?.isActive !== 'false',
  };
}

export function sortedDeals(settings, { activeOnly = false } = {}) {
  const rows = [...(settings.homepageDeals || [])];
  const visible = activeOnly ? rows.filter((deal) => deal.isActive !== false) : rows;
  return visible.sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.title).localeCompare(String(b.title)));
}
