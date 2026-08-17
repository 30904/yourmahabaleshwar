import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
    },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    refreshToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    vendorProfile: { type: mongoose.Schema.Types.ObjectId, refPath: 'vendorProfileModel' },
    vendorProfileModel: { type: String },
    wishlist: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
        itemType: {
          type: String,
          enum: ['HOTEL', 'RESORT', 'HOMESTAY', 'TENT', 'GUIDE', 'TAXI', 'HORSE'],
          required: true,
        },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    preferredLanguage: { type: String, enum: ['en', 'mr'], default: 'en' },
    walletBalance: { type: Number, default: 0 },
    pointBalance: { type: Number, default: 0 },
    monetizationMode: {
      type: String,
      enum: ['SUBSCRIPTION', 'POINTS', 'BOTH'],
      default: 'BOTH',
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
