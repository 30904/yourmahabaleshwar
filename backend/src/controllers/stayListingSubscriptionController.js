import { success, error } from '../utils/apiResponse.js';
import {
  confirmRenewalPayment,
  createRenewalOrder,
  getVendorStaySubscriptions,
  renewStayListingSubscription,
  setListingRenewalPrice,
  isStayListingType,
} from '../services/stayListingSubscriptionService.js';

export const getMyStaySubscriptions = async (req, res) => {
  try {
    const items = await getVendorStaySubscriptions(req.user._id);
    return success(res, { items });
  } catch (err) {
    return error(res, err.message || 'Failed to load subscriptions', 500);
  }
};

export const orderStaySubscriptionRenewal = async (req, res) => {
  try {
    const { listingType, listingId } = req.params;
    if (!isStayListingType(listingType)) return error(res, 'Invalid listing type', 400);

    const result = await createRenewalOrder(listingType, listingId, req.user._id);
    if (result.renewed) {
      return success(res, result, 'Subscription renewed');
    }
    return success(res, result);
  } catch (err) {
    return error(res, err.message || 'Failed to create renewal order', 400);
  }
};

export const confirmStaySubscriptionRenewal = async (req, res) => {
  try {
    const { listingType, listingId } = req.params;
    if (!isStayListingType(listingType)) return error(res, 'Invalid listing type', 400);

    const sub = await confirmRenewalPayment(listingType, listingId, req.user._id, req.body);
    return success(res, sub, 'Subscription renewed');
  } catch (err) {
    return error(res, err.message || 'Payment confirmation failed', 400);
  }
};

export const adminRenewStaySubscription = async (req, res) => {
  try {
    const { listingType, listingId } = req.params;
    if (!isStayListingType(listingType)) return error(res, 'Invalid listing type', 400);

    const sub = await renewStayListingSubscription(listingType, listingId, {
      paymentRef: req.body?.paymentRef || 'ADMIN_MANUAL',
      amountPaid: req.body?.amountPaid,
      notes: req.body?.notes || 'Renewed by admin',
    });
    return success(res, sub, 'Subscription renewed');
  } catch (err) {
    return error(res, err.message || 'Renewal failed', 400);
  }
};

export const adminSetStayRenewalPrice = async (req, res) => {
  try {
    const { listingType, listingId } = req.params;
    const { renewalPrice } = req.body;
    if (!isStayListingType(listingType)) return error(res, 'Invalid listing type', 400);

    const listing = await setListingRenewalPrice(listingType, listingId, renewalPrice);
    return success(res, listing, 'Renewal price updated');
  } catch (err) {
    return error(res, err.message || 'Failed to update renewal price', 400);
  }
};
