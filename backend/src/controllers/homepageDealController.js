import { ensureHomepageDealsSeeded, normalizeDeal, sortedDeals } from '../services/homepageDealService.js';
import { success, error } from '../utils/apiResponse.js';

export const getPublicHomepageDeals = async (req, res) => {
  const settings = await ensureHomepageDealsSeeded();
  return success(res, sortedDeals(settings, { activeOnly: true }));
};

export const getHomepageDeals = async (req, res) => {
  const settings = await ensureHomepageDealsSeeded();
  return success(res, sortedDeals(settings));
};

export const createHomepageDeal = async (req, res) => {
  try {
    const settings = await ensureHomepageDealsSeeded();
    settings.homepageDeals.push(normalizeDeal(req.body));
    await settings.save();
    const created = settings.homepageDeals[settings.homepageDeals.length - 1];
    return success(res, created, 'Deal created', 201);
  } catch (err) {
    return error(res, err.message || 'Could not create deal', err.statusCode || 400);
  }
};

export const updateHomepageDeal = async (req, res) => {
  try {
    const settings = await ensureHomepageDealsSeeded();
    const deal = settings.homepageDeals.id(req.params.id);
    if (!deal) return error(res, 'Deal not found', 404);
    Object.assign(deal, normalizeDeal(req.body));
    await settings.save();
    return success(res, deal, 'Deal updated');
  } catch (err) {
    return error(res, err.message || 'Could not update deal', err.statusCode || 400);
  }
};

export const deleteHomepageDeal = async (req, res) => {
  const settings = await ensureHomepageDealsSeeded();
  const deal = settings.homepageDeals.id(req.params.id);
  if (!deal) return error(res, 'Deal not found', 404);
  deal.deleteOne();
  await settings.save();
  return success(res, { _id: req.params.id }, 'Deal removed');
};
