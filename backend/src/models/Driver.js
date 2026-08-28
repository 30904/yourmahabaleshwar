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

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    operatorName: { type: String, trim: true },
    slug: { type: String, unique: true, lowercase: true },
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
    phone: { type: String },
    photo: { type: String },
    vehicleType: {
      type: String,
      enum: ['SEDAN', 'SUV', 'TEMPO', 'INNOVA', 'BIKE'],
      default: 'SEDAN',
    },
    vehicleNumber: { type: String },
    vehicle: {
      licenseNumber: String,
      licenseType: { type: String, enum: ['MCWOG', 'LMV', 'COMMERCIAL'] },
    },
    serviceArea: { type: String },
    experience: { type: Number, default: 1 },
    perTripPrice: { type: Number },
    hourlyRate: { type: Number },
    images: [String],
    bankDetails: { type: bankDetailsSchema, default: () => ({}) },
    rating: { type: Number, default: 4.3 },
    reviewCount: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    blockedDates: [{ type: Date }],
    approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    commissionRate: { type: Number, default: 8 },
    acceptedTermsAt: { type: Date },
    acceptedAgreementAt: { type: Date },
    declarationAcceptedAt: { type: Date },
  },
  { timestamps: true }
);

driverSchema.pre('save', function setSlug(next) {
  if (!this.slug && this.name) {
    this.slug = `${this.name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  if (!this.phone && this.contact?.primaryMobile) {
    this.phone = this.contact.primaryMobile;
  }
  next();
});

export default mongoose.model('Driver', driverSchema);
