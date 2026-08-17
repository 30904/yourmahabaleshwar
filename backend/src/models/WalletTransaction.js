import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT', 'POINTS_PURCHASE', 'POINTS_DEDUCT', 'COMMISSION', 'PAYOUT', 'REFUND'],
      required: true,
    },
    amount: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    balanceAfter: { type: Number, default: 0 },
    pointsAfter: { type: Number, default: 0 },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    payout: { type: mongoose.Schema.Types.ObjectId, ref: 'Payout' },
    description: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ vendor: 1, createdAt: -1 });

export default mongoose.model('WalletTransaction', walletTransactionSchema);
