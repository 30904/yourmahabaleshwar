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

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    type: { type: String, enum: ['HOTEL', 'RESORT'], default: 'HOTEL' },
    description: { type: String },
    shortDescription: { type: String },
    ownerName: { type: String },
    address: {
      line1: String,
      line2: String,
      city: { type: String, default: 'Mahabaleshwar' },
      state: { type: String, default: 'Maharashtra' },
      pincode: String,
    },
    location: { lat: Number, lng: Number },
    receptionPhone: { type: String },
    whatsapp: { type: String },
    propertyEmail: { type: String },
    website: { type: String },
    images: [{ type: String }],
    amenities: [String],
    roomInventory: { type: roomInventorySchema, default: () => ({}) },
    driverAccommodation: { type: Boolean, default: false },
    priceRangeFrom: { type: Number },
    priceRangeTo: { type: Number },
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
    isFeatured: { type: Boolean, default: false },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '11:00' },
    policies: { type: String },
    cancellationPolicyText: { type: String },
    gstNumber: { type: String },
    cancellationPolicy: {
      freeCancellationHours: { type: Number, default: 48 },
      partialRefundPercent: { type: Number, default: 50 },
      noRefundHours: { type: Number, default: 24 },
    },
    bankDetails: { type: bankDetailsSchema, default: () => ({}) },
    commissionRate: { type: Number, default: 10 },
    acceptedTermsAt: { type: Date },
    acceptedAgreementAt: { type: Date },
    declarationAcceptedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Hotel', hotelSchema);
