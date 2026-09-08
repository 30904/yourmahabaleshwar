import { success, error } from '../utils/apiResponse.js';
import {
  confirmHomepageAdPayment,
  createHomepageAdOrder,
  ensureHomepageHeroPackageSeeded,
  getHomepageHeroAds,
  getHomepageHeroPackages,
  listVendorHomepageAds,
  MAX_HOMEPAGE_HERO_SLOTS,
  countActiveHomepageHeroAds,
} from '../services/homepageAdsService.js';

export const getPublicHomepageHeroAds = async (req, res) => {
  try {
    await ensureHomepageHeroPackageSeeded();
    const items = await getHomepageHeroAds();
    return success(res, { items, maxSlots: MAX_HOMEPAGE_HERO_SLOTS });
  } catch (err) {
    return error(res, err.message || 'Failed to load homepage ads', 500);
  }
};

export const getVendorAdCatalog = async (req, res) => {
  try {
    await ensureHomepageHeroPackageSeeded();
    const [packages, activeSlots] = await Promise.all([
      getHomepageHeroPackages(),
      countActiveHomepageHeroAds(),
    ]);
    return success(res, {
      packages,
      activeSlots,
      maxSlots: MAX_HOMEPAGE_HERO_SLOTS,
      slotsRemaining: Math.max(0, MAX_HOMEPAGE_HERO_SLOTS - activeSlots),
    });
  } catch (err) {
    return error(res, err.message || 'Failed to load packages', 500);
  }
};

export const getMyHomepageAds = async (req, res) => {
  try {
    const items = await listVendorHomepageAds(req.user._id);
    return success(res, { items });
  } catch (err) {
    return error(res, err.message || 'Failed to load advertisements', 500);
  }
};

export const orderHomepageAd = async (req, res) => {
  try {
    const result = await createHomepageAdOrder(req.user._id, req.body);
    return success(res, result);
  } catch (err) {
    return error(res, err.message || 'Failed to create order', 400);
  }
};

export const confirmHomepageAd = async (req, res) => {
  try {
    const ad = await confirmHomepageAdPayment(req.user._id, req.body);
    return success(res, ad, 'Advertisement activated');
  } catch (err) {
    return error(res, err.message || 'Payment confirmation failed', 400);
  }
};
