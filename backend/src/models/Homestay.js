import mongoose from 'mongoose';

const bankDetailsSchema = new mongoose.Schema(
  {
    bankName: String,
    branch: String,
    accountHolder: String,
    accountNumber: String,
    ifsc: String,
  },
  { _id: false }
);

const roomInventorySchema = new mongoose.Schema(
  {
    totalRooms: { type: Number, default: 0 },
    nonAc: { type: Number, default: 0 },
    deluxeAc: { type: Number, default: 0 },
    suite: { type: Number, default: 0 },
    familyDorm: { type: Number, default: 0 },
  },
  { _id: false }
);

const homestayRoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, default: 'STANDARD' },
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
    ownerName: { type: String },
    location: { type: String, default: 'Mahabaleshwar' },
    address: {
      line1: String,
      city: { type: String, default: 'Mahabaleshwar' },
      state: { type: String, default: 'Maharashtra' },
      pincode: String,
    },
    receptionPhone: { type: String },
    whatsapp: { type: String },
    propertyEmail: { type: String },
    website: { type: String },
    images: [String],
    amenities: [String],
    houseRules: [String],
    roomInventory: { type: roomInventorySchema, default: () => ({}) },
    driverAccommodation: { type: Boolean, default: false },
    rooms: [homestayRoomSchema],
    priceFrom: { type: Number },
    priceRangeFrom: { type: Number },
    priceRangeTo: { type: Number },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '11:00' },
    cancellationPolicyText: { type: String },
    cancellationPolicy: {
      freeCancellationHours: { type: Number, default: 48 },
      partialRefundPercent: { type: Number, default: 50 },
      noRefundHours: { type: Number, default: 24 },
    },
    bankDetails: { type: bankDetailsSchema, default: () => ({}) },
    blockedDates: [{ type: Date }],
    rating: { type: Number, default: 4.2 },
    reviewCount: { type: Number, default: 0 },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gstNumber: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String },
    isActive: { type: Boolean, default: true },
    approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
    isFeatured: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 10 },
    subscriptionStartedAt: { type: Date },
    subscriptionExpiresAt: { type: Date },
    subscriptionStatus: {
      type: String,
      enum: ['NONE', 'ACTIVE', 'EXPIRED', 'PENDING_PAYMENT'],
      default: 'NONE',
    },
    renewalPrice: { type: Number },
    subscriptionExpiryWarningSentAt: { type: Date },
    acceptedTermsAt: { type: Date },
    declarationAcceptedAt: { type: Date },
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
  if (this.priceRangeFrom != null && !this.priceFrom) {
    this.priceFrom = this.priceRangeFrom;
  }
  next();
});

export default mongoose.model('Homestay', homestaySchema);
