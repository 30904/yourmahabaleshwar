import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    commission: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED'],
      default: 'PENDING',
    },
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
    transactionRef: { type: String },
    paidAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Payout', payoutSchema);
