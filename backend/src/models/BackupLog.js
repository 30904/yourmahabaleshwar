import mongoose from 'mongoose';

const backupLogSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['DAILY', 'WEEKLY', 'MANUAL'], default: 'MANUAL' },
    scope: { type: String, enum: ['DATABASE', 'MEDIA', 'FULL'], default: 'FULL' },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
    },
    filePath: { type: String },
    sizeBytes: { type: Number, default: 0 },
    collections: [String],
    error: { type: String },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('BackupLog', backupLogSchema);
