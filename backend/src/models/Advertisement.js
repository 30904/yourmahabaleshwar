import mongoose from 'mongoose';

const advertisementSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'AdPackage', required: true },
    listingType: {
      type: String,
      enum: ['HOTEL', 'RESORT', 'HOMESTAY', 'TENT', 'GUIDE', 'TAXI', 'HORSE', 'BANNER'],
    },
    listingId: { type: mongoose.Schema.Types.ObjectId },
    banner: { type: mongoose.Schema.Types.ObjectId, ref: 'Banner' },
    title: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'PAUSED'],
      default: 'PENDING',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    amountPaid: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

advertisementSchema.index({ status: 1, endDate: 1 });

export default mongoose.model('Advertisement', advertisementSchema);
