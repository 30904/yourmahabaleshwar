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

const horseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    operatorName: { type: String, trim: true },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
    fatherOrHusbandName: { type: String },
    dateOfBirth: { type: Date },
    address: {
      line1: String,
      pincode: String,
    },
    contact: {
      primaryMobile: String,
      alternateMobile: String,
      whatsapp: String,
      email: String,
      emergencyName: String,
      emergencyMobile: String,
    },
    stable: {
      serviceArea: String,
      horseCount: { type: Number, default: 1 },
      safetyGearProvided: { type: Boolean, default: true },
      experience: { type: Number, default: 1 },
    },
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
    experience: { type: Number, default: 1 },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contactPhone: { type: String },
    bankDetails: { type: bankDetailsSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
    isFeatured: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 10 },
    acceptedTermsAt: { type: Date },
    acceptedAgreementAt: { type: Date },
    declarationAcceptedAt: { type: Date },
  },
  { timestamps: true }
);

horseSchema.pre('save', function setSlug(next) {
  if (!this.slug && this.name) {
    this.slug = `${this.name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  if (!this.contactPhone && this.contact?.primaryMobile) {
    this.contactPhone = this.contact.primaryMobile;
  }
  if (this.routes?.length && !this.priceFrom) {
    this.priceFrom = Math.min(...this.routes.map((r) => r.price));
  }
  next();
});

export default mongoose.model('Horse', horseSchema);
