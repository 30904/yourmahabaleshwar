import AdPackage from '../models/AdPackage.js';
import Advertisement from '../models/Advertisement.js';
import Hotel from '../models/Hotel.js';
import Homestay from '../models/Homestay.js';
import Tent from '../models/Tent.js';
import { APPROVAL_STATUS, resolveListingStatus } from '../utils/listingApproval.js';
import { createOrder, verifyPaymentSignature } from './razorpayService.js';
import { createNotification } from './notificationService.js';

export const HOMEPAGE_HERO_PLACEMENT = 'HOMEPAGE_HERO';
export const MAX_HOMEPAGE_HERO_SLOTS = 3;
export const HOMEPAGE_AD_LISTING_TYPES = ['HOTEL', 'RESORT', 'HOMESTAY', 'TENT'];

const listingHref = (listingType, slug, id) => {
  const key = String(listingType || '').toUpperCase();
  const pathSlug = slug || id;
  if (key === 'RESORT') return `/resorts/${pathSlug}`;
  if (key === 'HOMESTAY') return `/homestays/${pathSlug}`;
  if (key === 'TENT') return `/tents/${pathSlug}`;
  return `/hotels/${pathSlug}`;
};

export function listingModelForAdType(listingType) {
  const key = String(listingType || '').toUpperCase();
  if (key === 'TENT') return Tent;
  if (key === 'HOMESTAY') return Homestay;
  return Hotel;
}

export async function countActiveHomepageHeroAds() {
  const now = new Date();
  return Advertisement.countDocuments({
    placement: HOMEPAGE_HERO_PLACEMENT,
    status: 'ACTIVE',
    endDate: { $gt: now },
  });
}

export async function getHomepageHeroPackages() {
  return AdPackage.find({
    placement: HOMEPAGE_HERO_PLACEMENT,
    isActive: true,
  }).sort('price');
}

async function loadListingForVendor(listingType, listingId, vendorId) {
  const type = String(listingType || '').toUpperCase();
  if (!HOMEPAGE_AD_LISTING_TYPES.includes(type)) {
    throw new Error('Only hotel, resort, homestay/villa and tent listings can advertise here');
  }

  const Model = listingModelForAdType(type);
  const listing = await Model.findById(listingId);
  if (!listing) throw new Error('Listing not found');

  const ownerId = listing.vendor || listing.operator;
  if (String(ownerId) !== String(vendorId)) throw new Error('Forbidden');
  if (resolveListingStatus(listing) !== APPROVAL_STATUS.APPROVED) {
    throw new Error('Only approved listings can be advertised');
  }
  if (type === 'HOTEL' && listing.type === 'RESORT') {
    throw new Error('Use RESORT listing type for this property');
  }
  if (type === 'RESORT' && listing.type && listing.type !== 'RESORT') {
    throw new Error('Listing is not a resort');
  }
  if (type === 'HOTEL' && listing.type && listing.type !== 'HOTEL') {
    throw new Error('Listing is not a hotel');
  }
  return listing;
}

function mapPublicAdCard(ad, listing) {
  const listingType = String(ad.listingType || '').toUpperCase();
  const slug = listing?.slug || String(listing?._id || ad.listingId);
  const address = listing?.address;
  const locationLabel =
    (typeof listing?.location === 'string' && listing.location) ||
    listing?.location?.area ||
    listing?.location?.city ||
    (typeof address === 'string' && address) ||
    address?.city ||
    address?.line1 ||
    listing?.city ||
    'Mahabaleshwar';

  return {
    adId: ad._id,
    listingType,
    listingId: listing?._id || ad.listingId,
    name: listing?.name || ad.title,
    slug,
    href: listingHref(listingType, listing?.slug, listing?._id || ad.listingId),
    image: listing?.images?.[0] || listing?.photo || listing?.imageUrl || null,
    priceFrom: listing?.priceFrom ?? listing?.basePrice ?? listing?.price ?? null,
    location: locationLabel,
    rating: listing?.ratingAverage ?? listing?.rating ?? null,
    endDate: ad.endDate,
  };
}

export async function getHomepageHeroAds(limit = MAX_HOMEPAGE_HERO_SLOTS) {
  const now = new Date();
  const ads = await Advertisement.find({
    placement: HOMEPAGE_HERO_PLACEMENT,
    status: 'ACTIVE',
    endDate: { $gt: now },
    listingId: { $ne: null },
  })
    .sort('startDate')
    .limit(Math.min(Number(limit) || MAX_HOMEPAGE_HERO_SLOTS, MAX_HOMEPAGE_HERO_SLOTS));

  const cards = [];
  for (const ad of ads) {
    const Model = listingModelForAdType(ad.listingType);
    const listing = await Model.findById(ad.listingId).select(
      'name slug images photo imageUrl priceFrom basePrice price location address ratingAverage rating type vendor isActive approvalStatus subscriptionStatus subscriptionExpiresAt'
    );
    if (!listing || listing.isActive === false) continue;
    if (resolveListingStatus(listing) !== APPROVAL_STATUS.APPROVED) continue;
    cards.push(mapPublicAdCard(ad, listing));
  }
  return cards;
}

export async function createHomepageAdOrder(vendorId, { packageId, listingType, listingId }) {
  const pkg = await AdPackage.findById(packageId);
  if (!pkg || !pkg.isActive || pkg.placement !== HOMEPAGE_HERO_PLACEMENT) {
    throw new Error('Invalid homepage advertisement package');
  }

  const activeCount = await countActiveHomepageHeroAds();
  if (activeCount >= MAX_HOMEPAGE_HERO_SLOTS) {
    throw new Error(
      `Homepage spotlight is full (${MAX_HOMEPAGE_HERO_SLOTS} listings). Try again when a slot opens.`
    );
  }

  const listing = await loadListingForVendor(listingType, listingId, vendorId);
  const amount = Number(pkg.price) || 0;
  if (amount <= 0) throw new Error('Package price not configured');

  const order = await createOrder(amount, `AD-HERO-${String(listingId).slice(-6)}`, {
    vendorId: String(vendorId),
    packageId: String(packageId),
    listingType: String(listingType).toUpperCase(),
    listingId: String(listingId),
    purpose: 'HOMEPAGE_HERO_AD',
  });

  return {
    package: pkg,
    listing: { id: listing._id, name: listing.name, listingType: String(listingType).toUpperCase() },
    amount,
    slotsRemaining: MAX_HOMEPAGE_HERO_SLOTS - activeCount,
    order,
    keyId: process.env.RAZORPAY_KEY_ID || 'mock_key',
  };
}

export async function activateHomepageHeroAd({
  vendorId,
  packageId,
  listingType,
  listingId,
  paymentRef,
  amountPaid,
}) {
  const pkg = await AdPackage.findById(packageId);
  if (!pkg || pkg.placement !== HOMEPAGE_HERO_PLACEMENT) {
    throw new Error('Invalid homepage advertisement package');
  }

  const activeCount = await countActiveHomepageHeroAds();
  if (activeCount >= MAX_HOMEPAGE_HERO_SLOTS) {
    throw new Error('Homepage spotlight is full. Payment received — contact support for a slot.');
  }

  const listing = await loadListingForVendor(listingType, listingId, vendorId);
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (pkg.durationDays || 7));

  const ad = await Advertisement.create({
    vendor: vendorId,
    package: packageId,
    listingType: String(listingType).toUpperCase(),
    listingId,
    title: listing.name || pkg.name,
    placement: HOMEPAGE_HERO_PLACEMENT,
    status: 'ACTIVE',
    startDate,
    endDate,
    amountPaid: amountPaid ?? pkg.price,
    paymentRef,
  });

  await createNotification({
    userId: vendorId,
    title: 'Homepage advertisement live',
    message: `"${listing.name}" is now featured on the homepage until ${endDate.toLocaleDateString('en-IN')}.`,
    type: 'SYSTEM',
    link: '/dashboard/vendor/advertisements',
  });

  return ad;
}

export async function confirmHomepageAdPayment(vendorId, paymentData) {
  const {
    packageId,
    listingType,
    listingId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = paymentData || {};

  const valid = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!valid) throw new Error('Invalid payment signature');

  const pkg = await AdPackage.findById(packageId);
  if (!pkg) throw new Error('Package not found');

  return activateHomepageHeroAd({
    vendorId,
    packageId,
    listingType,
    listingId,
    paymentRef: razorpayPaymentId || razorpayOrderId,
    amountPaid: pkg.price,
  });
}

export async function listVendorHomepageAds(vendorId) {
  return Advertisement.find({
    vendor: vendorId,
    placement: HOMEPAGE_HERO_PLACEMENT,
  })
    .populate('package')
    .sort('-createdAt')
    .limit(50);
}

export async function ensureHomepageHeroPackageSeeded() {
  await AdPackage.findOneAndUpdate(
    { code: 'HERO7' },
    {
      name: 'Homepage Spotlight 7 days',
      code: 'HERO7',
      description: 'Show your listing in the homepage hero (up to 3 sponsored listings).',
      price: 2499,
      durationDays: 7,
      placement: HOMEPAGE_HERO_PLACEMENT,
      isActive: true,
    },
    { upsert: true, new: true }
  );
}
