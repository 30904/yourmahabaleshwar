import mongoose from 'mongoose';

const canvasserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: Date,
    mobile: { type: String, required: true, trim: true },
    whatsapp: { type: String, trim: true },
    currentAddress: { type: String, trim: true },
    educationalQualification: { type: String, trim: true },
    totalWorkExperience: { type: String, trim: true },
    languagesKnown: { type: String, trim: true },
    ownVehicle: { type: Boolean, default: false },
    drivingLicense: { type: Boolean, default: false },
    joiningDate: Date,
    termsAccepted: { type: Boolean, default: false },
    declarationAccepted: { type: Boolean, default: false },
    declarationDate: Date,
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

canvasserSchema.index({ mobile: 1 });
canvasserSchema.index({ fullName: 1 });

export default mongoose.model('Canvasser', canvasserSchema);
