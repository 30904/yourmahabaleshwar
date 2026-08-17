import mongoose from 'mongoose';

const homestayRoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    capacity: { type: Number, default: 2 },
    basePrice: { type: Number, required: true },
    totalRooms: { type: Number, default: 1 },
    amenities: [String],
    images: [String],
  },
  { _id: true }
);

const homestaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String },
    location: { type: String, default: 'Mahabaleshwar' },
    address: {
      line1: String,
      city: { type: String, default: 'Mahabaleshwar' },
      state: { type: String, default: 'Maharashtra' },
      pincode: String,
    },
    images: [String],
    amenities: [String],
    houseRules: [String],
    rooms: [homestayRoomSchema],
    priceFrom: { type: Number },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '11:00' },
    cancellationPolicy: {
      freeCancellationHours: { type: Number, default: 48 },
      partialRefundPercent: { type: Number, default: 50 },
      noRefundHours: { type: Number, default: 24 },
    },
    blockedDates: [{ type: Date }],
    rating: { type: Number, default: 4.2 },
    reviewCount: { type: Number, default: 0 },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gstNumber: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 10 },
  },
  { timestamps: true }
);

homestaySchema.pre('save', function setSlug(next) {
  if (!this.slug && this.name) {
    this.slug = `${this.name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  if (this.rooms?.length && !this.priceFrom) {
    this.priceFrom = Math.min(...this.rooms.map((r) => r.basePrice));
  }
  next();
});

export default mongoose.model('Homestay', homestaySchema);
