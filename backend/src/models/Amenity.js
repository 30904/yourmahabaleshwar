import mongoose from 'mongoose';

const amenitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, unique: true, lowercase: true },
    icon: { type: String, default: 'Sparkles' },
    category: {
      type: String,
      enum: ['GENERAL', 'ROOM', 'WELLNESS', 'OUTDOOR', 'DINING', 'SERVICES'],
      default: 'GENERAL',
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Amenity', amenitySchema);
