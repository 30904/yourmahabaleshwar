import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    method: { type: String },
    path: { type: String },
    ip: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
    statusCode: { type: Number },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
