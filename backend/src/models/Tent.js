import mongoose from 'mongoose';

const tentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String },
    location: { type: String, default: 'Mahabaleshwar' },
    images: [String],
    capacity: { type: Number, default: 2 },
    totalTents: { type: Number, default: 10 },
    pricePerNight: { type: Number, required: true },
    amenities: [String],
    rating: { type: Number, default: 4.0 },
    reviewCount: { type: Number, default: 0 },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    blockedDates: [{ type: Date }],
    cancellationPolicy: {
      freeCancellationHours: { type: Number, default: 48 },
      partialRefundPercent: { type: Number, default: 50 },
      noRefundHours: { type: Number, default: 24 },
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 10 },
  },
  { timestamps: true }
);

export default mongoose.model('Tent', tentSchema);
