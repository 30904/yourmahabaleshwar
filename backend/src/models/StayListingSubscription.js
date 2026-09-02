import mongoose from 'mongoose';

const stayListingSubscriptionSchema = new mongoose.Schema(
  {
    listingType: {
      type: String,
      enum: ['HOTEL', 'RESORT', 'HOMESTAY'],
      required: true,
    },
    listingId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    yearNumber: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    amount: { type: Number, default: 0 },
    isFreeYear: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'PENDING_PAYMENT', 'CANCELLED'],
      default: 'ACTIVE',
    },
    renewalPrice: { type: Number },
    paymentRef: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

stayListingSubscriptionSchema.index({ listingId: 1, listingType: 1, status: 1 });
stayListingSubscriptionSchema.index({ vendor: 1, status: 1 });

export default mongoose.model('StayListingSubscription', stayListingSubscriptionSchema);
