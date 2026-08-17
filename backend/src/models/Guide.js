import mongoose from 'mongoose';

const guideSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    bio: { type: String },
    languages: [String],
    specialties: [String],
    photo: { type: String },
    images: [String],
    experience: { type: Number, default: 1 },
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    package6hr: { type: Number, required: true },
    package12hr: { type: Number, required: true },
    bikeAddonPrice: { type: Number, default: 500 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 12 },
  },
  { timestamps: true }
);

export default mongoose.model('Guide', guideSchema);
