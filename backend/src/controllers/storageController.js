import { success, error } from '../utils/apiResponse.js';
import { UPLOAD_CATEGORIES } from '../config/storagePaths.js';
import { persistMulterFile, getStorageInfo } from '../services/storageService.js';

function parseMeta(body = {}) {
  const meta = {};
  const keys = ['docField', 'tenant', 'listingId', 'ownerId', 'propertyId', 'bookingId', 'bannerId', 'blogId', 'productId', 'staffId'];
  keys.forEach((k) => {
    if (body[k]) meta[k] = body[k];
  });
  return meta;
}

export const getStorageConfig = async (req, res) => {
  return success(res, getStorageInfo());
};

export const uploadFile = async (req, res) => {
  try {
    const category = String(req.body.category || req.query.category || '').trim();
    if (!UPLOAD_CATEGORIES.includes(category)) {
      return error(res, `Invalid upload category. Allowed: ${UPLOAD_CATEGORIES.join(', ')}`, 400);
    }
    if (!req.file) return error(res, 'No file uploaded', 400);

    const meta = parseMeta(req.body);
    meta.userId = req.user?._id?.toString();

    if (category === 'kyc' && !meta.docField) {
      return error(res, 'docField is required for KYC uploads', 400);
    }
    if (category === 'listing-image' && !meta.tenant) {
      return error(res, 'tenant is required for listing image uploads', 400);
    }

    const saved = await persistMulterFile(req.file, category, meta);
    return success(
      res,
      {
        key: saved.key,
        url: saved.url,
        storage: saved.storage,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      'File uploaded',
      201
    );
  } catch (e) {
    return error(res, e.message || 'Upload failed', 500);
  }
};
