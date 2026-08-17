import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    channel: { type: String, enum: ['EMAIL', 'SMS', 'WHATSAPP'], required: true },
    subject: { type: String },
    message: { type: String, required: true },
    audience: {
      type: String,
      enum: ['ALL_CUSTOMERS', 'ALL_VENDORS', 'CUSTOMERS', 'VENDORS', 'SEGMENT'],
      default: 'ALL_CUSTOMERS',
    },
    segmentRoles: [String],
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED'],
      default: 'DRAFT',
    },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    stats: {
      targeted: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Campaign', campaignSchema);
