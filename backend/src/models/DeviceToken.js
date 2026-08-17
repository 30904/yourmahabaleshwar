import mongoose from 'mongoose';

const deviceTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true },
    platform: { type: String, enum: ['ANDROID', 'IOS', 'WEB'], default: 'ANDROID' },
    appRole: { type: String, enum: ['CUSTOMER', 'VENDOR', 'ANY'], default: 'ANY' },
    isActive: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

deviceTokenSchema.index({ user: 1, token: 1 }, { unique: true });

export default mongoose.model('DeviceToken', deviceTokenSchema);
