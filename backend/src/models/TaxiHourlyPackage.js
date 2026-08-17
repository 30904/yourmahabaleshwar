import mongoose from 'mongoose';

const taxiHourlyPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    vehicleType: { type: String, enum: ['SEDAN', 'SUV', 'INNOVA', 'TEMPO', 'ANY'], default: 'ANY' },
    minHours: { type: Number, default: 4 },
    hourlyRate: { type: Number, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('TaxiHourlyPackage', taxiHourlyPackageSchema);
