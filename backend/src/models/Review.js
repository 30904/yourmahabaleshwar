import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    tent: { type: mongoose.Schema.Types.ObjectId, ref: 'Tent' },
    guide: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide' },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    homestay: { type: mongoose.Schema.Types.ObjectId, ref: 'Homestay' },
    horse: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse' },
    listingType: {
      type: String,
      enum: ['HOTEL', 'RESORT', 'HOMESTAY', 'TENT', 'GUIDE', 'TAXI', 'HORSE'],
    },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, booking: 1 }, { unique: true, sparse: true });

export default mongoose.model('Review', reviewSchema);
