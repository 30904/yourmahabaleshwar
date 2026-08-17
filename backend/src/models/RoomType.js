import mongoose from 'mongoose';

const roomTypeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    defaultCapacity: { type: Number, default: 2, min: 1 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('RoomType', roomTypeSchema);
