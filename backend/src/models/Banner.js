import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    titleMr: { type: String },
    subtitle: { type: String },
    subtitleMr: { type: String },
    image: { type: String, required: true },
    link: { type: String },
    vertical: {
      type: String,
      enum: ['ALL', 'HOTEL', 'TENT', 'GUIDE', 'TAXI', 'HOMESTAY', 'HORSE'],
      default: 'ALL',
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    isSponsored: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Banner', bannerSchema);
