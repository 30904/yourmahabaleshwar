import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['DRIVER', 'HOURLY', 'GENERAL'], required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    message: { type: String },
    pickupLocation: { type: String },
    dropLocation: { type: String },
    date: { type: Date },
    hours: { type: Number },
    vehicleType: { type: String },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'],
      default: 'NEW',
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Enquiry', enquirySchema);
