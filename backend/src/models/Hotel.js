import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    type: { type: String, enum: ['HOTEL', 'RESORT'], default: 'HOTEL' },
    description: { type: String },
    shortDescription: { type: String },
    address: {
      line1: String,
      line2: String,
      city: { type: String, default: 'Mahabaleshwar' },
      state: { type: String, default: 'Maharashtra' },
      pincode: String,
    },
    location: { lat: Number, lng: Number },
    images: [{ type: String }],
    amenities: [String],
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
    isFeatured: { type: Boolean, default: false },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '11:00' },
    policies: { type: String },
    gstNumber: { type: String },
    cancellationPolicy: {
      freeCancellationHours: { type: Number, default: 48 },
      partialRefundPercent: { type: Number, default: 50 },
      noRefundHours: { type: Number, default: 24 },
    },
    commissionRate: { type: Number, default: 10 },
  },
  { timestamps: true }
);

export default mongoose.model('Hotel', hotelSchema);
