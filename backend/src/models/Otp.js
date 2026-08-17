import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true, trim: true, lowercase: true },
    channel: { type: String, enum: ['PHONE', 'EMAIL'], required: true },
    purpose: {
      type: String,
      enum: ['LOGIN', 'SIGNUP', 'VERIFY'],
      required: true,
    },
    codeHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    consumed: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

otpSchema.index({ identifier: 1, purpose: 1, createdAt: -1 });
// Cleanup expired OTPs shortly after expiry
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

otpSchema.methods.matchCode = async function matchCode(code) {
  return bcrypt.compare(String(code), this.codeHash);
};

export default mongoose.model('Otp', otpSchema);
