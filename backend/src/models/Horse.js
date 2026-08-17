import mongoose from 'mongoose';

const horseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String },
    horseDetails: { type: String },
    routes: [
      {
        name: { type: String, required: true },
        durationMinutes: { type: Number, default: 30 },
        price: { type: Number, required: true },
        description: String,
      },
    ],
    priceFrom: { type: Number },
    location: { type: String, default: 'Mahabaleshwar' },
    images: [String],
    availability: {
      daysOfWeek: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
      slotsPerDay: { type: Number, default: 8 },
    },
    blockedDates: [{ type: Date }],
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contactPhone: { type: String },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 10 },
  },
  { timestamps: true }
);

horseSchema.pre('save', function setSlug(next) {
  if (!this.slug && this.name) {
    this.slug = `${this.name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  if (this.routes?.length && !this.priceFrom) {
    this.priceFrom = Math.min(...this.routes.map((r) => r.price));
  }
  next();
});

export default mongoose.model('Horse', horseSchema);
