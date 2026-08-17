import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    razorpayRefundId: { type: String },
    refundedAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIAL_REFUND'],
      default: 'CREATED',
    },
    method: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
