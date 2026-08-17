import mongoose from 'mongoose';

const documentRequirementSchema = new mongoose.Schema(
  {
    vendorType: {
      type: String,
      enum: ['HOTEL', 'RESORT', 'HOMESTAY', 'GUIDE', 'TAXI', 'TENT', 'HORSE', 'DRIVER'],
      required: true,
      unique: true,
    },
    requiredDocs: [
      {
        code: { type: String, required: true },
        label: { type: String, required: true },
        required: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('DocumentRequirement', documentRequirementSchema);
