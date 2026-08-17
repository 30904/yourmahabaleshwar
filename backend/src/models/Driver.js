import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    phone: { type: String },
    photo: { type: String },
    vehicleType: {
      type: String,
      enum: ['SEDAN', 'SUV', 'TEMPO', 'INNOVA', 'BIKE'],
      default: 'SEDAN',
    },
    vehicleNumber: { type: String },
    perTripPrice: { type: Number },
    hourlyRate: { type: Number },
    rating: { type: Number, default: 4.3 },
    reviewCount: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    commissionRate: { type: Number, default: 8 },
  },
  { timestamps: true }
);

export default mongoose.model('Driver', driverSchema);
