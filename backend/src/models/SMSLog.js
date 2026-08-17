import mongoose from 'mongoose';

const smsLogSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    message: { type: String, required: true },
    provider: { type: String, enum: ['FAST2SMS', 'MSG91'], default: 'FAST2SMS' },
    templateId: { type: String },
    status: { type: String, enum: ['SENT', 'FAILED', 'PENDING'], default: 'PENDING' },
    response: { type: mongoose.Schema.Types.Mixed },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('SMSLog', smsLogSchema);
