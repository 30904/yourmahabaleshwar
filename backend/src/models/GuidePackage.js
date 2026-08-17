import mongoose from 'mongoose';

const guidePackageSchema = new mongoose.Schema(
  {
    guide: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide' },
    name: { type: String, required: true },
    code: { type: String, required: true },
    durationHours: { type: Number, required: true },
    price: { type: Number, required: true },
    bikeAddonPrice: { type: Number, default: 0 },
    description: { type: String },
    placesCovered: [String],
    isActive: { type: Boolean, default: true },
    isGlobal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

guidePackageSchema.index({ guide: 1, code: 1 });

export default mongoose.model('GuidePackage', guidePackageSchema);
