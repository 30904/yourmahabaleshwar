import mongoose from 'mongoose';

const adPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    price: { type: Number, required: true },
    durationDays: { type: Number, default: 7 },
    placement: {
      type: String,
      enum: ['FEATURED', 'SPONSORED', 'HOMEPAGE_BANNER', 'SEARCH_PRIORITY'],
      required: true,
    },
    impressionsTarget: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('AdPackage', adPackageSchema);
