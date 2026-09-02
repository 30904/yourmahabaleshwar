import mongoose from 'mongoose';

const bankDetailsSchema = new mongoose.Schema(
  {
    accountHolder: String,
    accountNumber: String,
    ifsc: String,
    bankName: String,
    branch: String,
    upiId: String,
  },
  { _id: false }
);

const kycSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendorType: {
      type: String,
      enum: [
        'HOTEL',
        'RESORT',
        'HOMESTAY',
        'GUIDE',
        'TAXI',
        'TENT',
        'HORSE',
        'DRIVER',
      ],
    },
    aadhar: { type: String },
    aadharDoc: { type: String },
    pan: { type: String },
    panDoc: { type: String },
    rc: { type: String },
    rcDoc: { type: String },
    puc: { type: String },
    pucDoc: { type: String },
    insurance: { type: String },
    insuranceDoc: { type: String },
    license: { type: String },
    licenseDoc: { type: String },
    addressProofDoc: { type: String },
    gstDoc: { type: String },
    gstNumber: { type: String },
    businessRegDoc: { type: String },
    hotelLicenseDoc: { type: String },
    guideLicenseDoc: { type: String },
    fitnessDoc: { type: String },
    permitDoc: { type: String },
    bankDetails: bankDetailsSchema,
    bankProofDoc: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    rejectionReason: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('KYC', kycSchema);
