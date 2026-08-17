import User from '../models/User.js';
import Hotel from '../models/Hotel.js';
import Tent from '../models/Tent.js';
import Guide from '../models/Guide.js';
import Driver from '../models/Driver.js';
import Homestay from '../models/Homestay.js';
import Horse from '../models/Horse.js';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService.js';
import { success, error } from '../utils/apiResponse.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';
import { Router } from 'express';

const resolveWishlistItems = async (wishlist = []) => {
  const results = [];
  for (const entry of wishlist) {
    const type = entry.itemType;
    const id = entry.itemId;
    let item = null;
    if (type === 'HOTEL' || type === 'RESORT') item = await Hotel.findById(id);
    else if (type === 'TENT') item = await Tent.findById(id);
    else if (type === 'GUIDE') item = await Guide.findById(id);
    else if (type === 'TAXI') item = await Driver.findById(id);
    else if (type === 'HOMESTAY') item = await Homestay.findById(id);
    else if (type === 'HORSE') item = await Horse.findById(id);
    if (item) results.push({ itemType: type, item, addedAt: entry.addedAt });
  }
  return results;
};

const router = Router();
router.use(protect);

router.get('/me', async (req, res) => success(res, req.user));

router.get('/', authorize(ROLES.SUPER_ADMIN), async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt').limit(200);
  return success(res, users);
});

router.patch('/me', async (req, res) => {
  const allowed = ['name', 'phone', 'avatar', 'address', 'preferredLanguage'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
  return success(res, user);
});

router.get('/wishlist', async (req, res) => {
  const user = await User.findById(req.user._id);
  const items = await resolveWishlistItems(user.wishlist || []);
  return success(res, items);
});

router.post('/wishlist', async (req, res) => {
  const { itemId, itemType } = req.body;
  if (!itemId || !itemType) return error(res, 'itemId and itemType required', 400);
  const user = await User.findById(req.user._id);
  const exists = (user.wishlist || []).some(
    (w) => String(w.itemId) === String(itemId) && w.itemType === itemType
  );
  if (!exists) {
    user.wishlist.push({ itemId, itemType });
    await user.save();
  }
  return success(res, user.wishlist, 'Added to wishlist');
});

router.delete('/wishlist/:itemId', async (req, res) => {
  const user = await User.findById(req.user._id);
  const { itemType } = req.query;
  user.wishlist = (user.wishlist || []).filter((w) => {
    if (String(w.itemId) !== String(req.params.itemId)) return true;
    if (itemType && w.itemType !== itemType) return true;
    return false;
  });
  await user.save();
  return success(res, user.wishlist, 'Removed from wishlist');
});

router.get('/notifications', async (req, res) => {
  const items = await listNotifications(req.user._id, {
    unreadOnly: req.query.unread === 'true',
    limit: req.query.limit || 50,
  });
  return success(res, items);
});

router.patch('/notifications/:id/read', async (req, res) => {
  const item = await markNotificationRead(req.user._id, req.params.id);
  if (!item) return error(res, 'Not found', 404);
  return success(res, item);
});

router.post('/notifications/read-all', async (req, res) => {
  await markAllNotificationsRead(req.user._id);
  return success(res, null, 'All marked read');
});

router.get('/kyc', async (req, res) => {
  const { getMyKyc } = await import('../controllers/domainController.js');
  return getMyKyc(req, res);
});

router.post('/kyc', async (req, res, next) => {
  const { uploadKycDocs } = await import('../middleware/upload.js');
  uploadKycDocs(req, res, async (err) => {
    if (err) return error(res, err.message, 400);
    const { submitKyc } = await import('../controllers/domainController.js');
    return submitKyc(req, res);
  });
});

router.post('/devices', async (req, res) => {
  try {
    const { registerDeviceToken } = await import('../services/pushService.js');
    const { token, platform, appRole } = req.body;
    if (!token) return error(res, 'token required', 400);
    const doc = await registerDeviceToken({
      userId: req.user._id,
      token,
      platform: platform || 'ANDROID',
      appRole: appRole || 'ANY',
    });
    return success(res, doc, 'Device registered');
  } catch (err) {
    return error(res, err.message, 400);
  }
});

router.delete('/devices/:token', async (req, res) => {
  try {
    const { removeDeviceToken } = await import('../services/pushService.js');
    await removeDeviceToken({ userId: req.user._id, token: decodeURIComponent(req.params.token) });
    return success(res, null, 'Device removed');
  } catch (err) {
    return error(res, err.message, 400);
  }
});

export default router;
