import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true },
    description: { type: String },
    discountType: { type: String, enum: ['PERCENT', 'FLAT'], default: 'PERCENT' },
    discountValue: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    validFrom: { type: Date },
    validUntil: { type: Date },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    applicableTypes: [{ type: String, enum: ['HOTEL', 'RESORT', 'TENT', 'GUIDE', 'TAXI'] }],
    isActive: { type: Boolean, default: true },
    isFlashOffer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Coupon', couponSchema);
