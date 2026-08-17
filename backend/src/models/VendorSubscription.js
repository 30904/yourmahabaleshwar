import mongoose from 'mongoose';

const vendorSubscriptionSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: false },
    amountPaid: { type: Number, default: 0 },
    paymentRef: { type: String },
  },
  { timestamps: true }
);

vendorSubscriptionSchema.index({ vendor: 1, status: 1 });

export default mongoose.model('VendorSubscription', vendorSubscriptionSchema);
