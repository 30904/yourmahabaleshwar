import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    platformName: { type: String, default: 'YOURMAHABALESHWAR.COM' },
    commissionPercent: { type: Number, default: 10 },
    gstPercent: { type: Number, default: 12 },
    serviceChargePercent: { type: Number, default: 0 },
    razorpayKeyId: { type: String },
    razorpayKeySecret: { type: String },
    smsProvider: { type: String, default: 'FAST2SMS' },
    smsApiKey: { type: String },
    smsSenderId: { type: String },
    whatsappApiUrl: { type: String },
    whatsappApiToken: { type: String },
    whatsappEnabled: { type: Boolean, default: false },
    emailFrom: { type: String },
    razorpayWebhookSecret: { type: String },
    seoTitle: { type: String },
    seoDescription: { type: String },
    seoKeywords: [String],
    supportEmail: { type: String },
    supportPhone: { type: String },
    defaultCancellationPolicy: {
      freeCancellationHours: { type: Number, default: 48 },
      partialRefundPercent: { type: Number, default: 50 },
      noRefundHours: { type: Number, default: 24 },
    },
    pointsPerBooking: { type: Number, default: 10 },
    lowPointThreshold: { type: Number, default: 20 },
    pointRechargeRate: { type: Number, default: 1 },
    vendorMonetizationMode: {
      type: String,
      enum: ['SUBSCRIPTION', 'POINTS', 'BOTH'],
      default: 'BOTH',
    },
    stayListingDefaultRenewalPrice: { type: Number, default: 5000 },
    staySubscriptionWarningDays: { type: Number, default: 30 },
    serviceMonetization: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export default mongoose.model('PlatformSettings', platformSettingsSchema);
