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

const guideSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
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
    vehicle: {
      ownsTwoWheeler: { type: Boolean, default: false },
      ownsFourWheeler: { type: Boolean, default: false },
      drivingSkill: { type: String, enum: ['TWO_WHEELER', 'FOUR_WHEELER', 'BOTH'] },
      licenseNumber: String,
      licenseType: { type: String, enum: ['MCWOG', 'LMV', 'COMMERCIAL'] },
    },
    bio: { type: String },
    languages: [String],
    otherLanguages: [String],
    specialties: [String],
    mainTourismArea: { type: String },
    photo: { type: String },
    images: [String],
    experience: { type: Number, default: 1 },
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    package6hr: { type: Number, required: true },
    package12hr: { type: Number, required: true },
    bikeAddonPrice: { type: Number, default: 500 },
    bankDetails: { type: bankDetailsSchema, default: () => ({}) },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
    isFeatured: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 12 },
    acceptedTermsAt: { type: Date },
    declarationAcceptedAt: { type: Date },
  },
  { timestamps: true }
);

guideSchema.pre('save', function setSlug(next) {
  if (!this.slug && this.name) {
    this.slug = `${this.name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  next();
});

export default mongoose.model('Guide', guideSchema);
