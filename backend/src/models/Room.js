import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    name: { type: String, required: true },
    type: { type: String, default: 'STANDARD', uppercase: true, trim: true },
    description: { type: String },
    capacity: { type: Number, default: 2 },
    basePrice: { type: Number, required: true },
    seasonalPricing: [
      {
        season: String,
        startDate: Date,
        endDate: Date,
        price: Number,
      },
    ],
    images: [String],
    amenities: [String],
    totalRooms: { type: Number, default: 5 },
    blockedDates: [{ type: Date }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Room', roomSchema);
