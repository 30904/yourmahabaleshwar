import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    priceMonthly: { type: Number, required: true },
    durationDays: { type: Number, default: 30 },
    unlimitedBookings: { type: Boolean, default: true },
    marketingAccess: { type: Boolean, default: true },
    dashboardAccess: { type: Boolean, default: true },
    pointsIncluded: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
