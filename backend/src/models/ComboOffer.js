import mongoose from 'mongoose';

const comboItemSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ['HOTEL', 'RESORT', 'HOMESTAY', 'TENT', 'GUIDE', 'TAXI', 'HORSE', 'PRODUCT'],
      required: true,
    },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    label: { type: String },
    quantity: { type: Number, default: 1 },
    nights: { type: Number, default: 1 },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const comboOfferSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String },
    images: [String],
    items: [comboItemSchema],
    originalPrice: { type: Number, required: true },
    comboPrice: { type: Number, required: true },
    validFrom: { type: Date },
    validTo: { type: Date },
    maxRedemptions: { type: Number },
    redemptionCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commissionRate: { type: Number, default: 10 },
  },
  { timestamps: true }
);

comboOfferSchema.pre('save', function setSlug(next) {
  if (!this.slug && this.name) {
    this.slug = `${this.name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  next();
});

comboOfferSchema.virtual('savings').get(function savings() {
  return Math.max(0, (this.originalPrice || 0) - (this.comboPrice || 0));
});

comboOfferSchema.set('toJSON', { virtuals: true });
comboOfferSchema.set('toObject', { virtuals: true });

export default mongoose.model('ComboOffer', comboOfferSchema);
