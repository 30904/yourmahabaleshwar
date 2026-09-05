import User from '../models/User.js';
import SubscriptionInvoice from '../models/SubscriptionInvoice.js';
import { generateSubscriptionInvoicePdf } from './invoiceService.js';

/**
 * Generate a Your Mahabaleshwar–branded invoice for paid vendor subscriptions / points.
 * Skips when amount is 0 (free / admin grants).
 */
export async function issueSubscriptionInvoice({
  vendorId,
  kind,
  title,
  description,
  amount,
  paymentRef,
  metadata = {},
  walletTransactionId,
  vendorSubscriptionId,
  stayListingSubscriptionId,
}) {
  const paid = Number(amount || 0);
  if (!Number.isFinite(paid) || paid <= 0) return null;

  const vendor = await User.findById(vendorId).select('name email phone role');
  if (!vendor) throw new Error('Vendor not found for invoice');

  const pdf = await generateSubscriptionInvoicePdf({
    vendor,
    title,
    description,
    amount: paid,
    paymentRef,
    metaLines: Object.entries(metadata || {})
      .filter(([, v]) => v != null && v !== '')
      .slice(0, 4)
      .map(([k, v]) => `${k}: ${v}`),
  });

  const doc = await SubscriptionInvoice.create({
    vendor: vendorId,
    kind,
    title,
    description,
    amount: paid,
    paymentRef,
    invoiceNumber: pdf.invoiceNumber,
    invoiceUrl: pdf.invoiceUrl,
    metadata,
    walletTransaction: walletTransactionId || undefined,
    vendorSubscription: vendorSubscriptionId || undefined,
    stayListingSubscription: stayListingSubscriptionId || undefined,
  });

  return {
    invoiceId: doc._id,
    invoiceNumber: doc.invoiceNumber,
    invoiceUrl: doc.invoiceUrl,
    filePath: pdf.filePath,
  };
}
