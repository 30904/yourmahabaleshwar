import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    photo: String,
    aadhaarDoc: String,
    panDoc: String,
    addressProof: String,
    otherDocs: [String],
  },
  { _id: false }
);

const staffProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, trim: true },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    dateOfBirth: Date,
    dateOfJoining: Date,
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER', ''], default: '' },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },
    aadhaarNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    documents: documentSchema,
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('StaffProfile', staffProfileSchema);
