import mongoose from 'mongoose';

const notificationTemplateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    channel: { type: String, enum: ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'], default: 'IN_APP' },
    subject: { type: String },
    body: { type: String, required: true },
    variables: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('NotificationTemplate', notificationTemplateSchema);
