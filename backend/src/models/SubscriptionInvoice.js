import mongoose from 'mongoose';

const subscriptionInvoiceSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: {
      type: String,
      enum: ['POINTS_RECHARGE', 'UNLIMITED_MONTHLY', 'STAY_LISTING_RENEWAL', 'PLAN_SUBSCRIPTION'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true, min: 0 },
    paymentRef: { type: String },
    invoiceNumber: { type: String, required: true, unique: true },
    invoiceUrl: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    walletTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction' },
    vendorSubscription: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorSubscription' },
    stayListingSubscription: { type: mongoose.Schema.Types.ObjectId, ref: 'StayListingSubscription' },
  },
  { timestamps: true }
);

subscriptionInvoiceSchema.index({ vendor: 1, createdAt: -1 });

export default mongoose.model('SubscriptionInvoice', subscriptionInvoiceSchema);
