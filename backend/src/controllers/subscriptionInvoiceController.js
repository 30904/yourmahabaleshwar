import { success, error } from '../utils/apiResponse.js';
import SubscriptionInvoice from '../models/SubscriptionInvoice.js';
import { resolveInvoiceFilePath } from '../services/invoiceService.js';
import { ROLES } from '../constants/roles.js';

export const listMySubscriptionInvoices = async (req, res) => {
  try {
    const vendorId =
      req.user.role === ROLES.SUPER_ADMIN && req.query.vendorId
        ? req.query.vendorId
        : req.user._id;
    const items = await SubscriptionInvoice.find({ vendor: vendorId })
      .sort('-createdAt')
      .limit(50)
      .lean();
    return success(res, { items });
  } catch (err) {
    return error(res, err.message || 'Failed to load invoices', 500);
  }
};

export const downloadSubscriptionInvoice = async (req, res) => {
  try {
    const invoice = await SubscriptionInvoice.findById(req.params.id);
    if (!invoice) return error(res, 'Invoice not found', 404);

    const isOwner = String(invoice.vendor) === String(req.user._id);
    if (!isOwner && req.user.role !== ROLES.SUPER_ADMIN) {
      return error(res, 'Forbidden', 403);
    }

    const filePath = resolveInvoiceFilePath(invoice.invoiceNumber);
    if (!filePath) return error(res, 'Invoice file missing', 404);

    return res.download(filePath, `${invoice.invoiceNumber}.pdf`);
  } catch (err) {
    return error(res, err.message || 'Download failed', 500);
  }
};
