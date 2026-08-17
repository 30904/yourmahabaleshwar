import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    vertical: { type: String, enum: ['STRAWBERRY', 'MAPRO'], required: true, index: true },
    description: { type: String },
    shortDescription: { type: String },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    unit: { type: String, default: 'pack', enum: ['kg', 'box', 'pack', 'bottle', 'jar', 'piece'] },
    stock: { type: Number, default: 100 },
    sku: { type: String },
    images: [String],
    tags: [String],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commissionRate: { type: Number, default: 10 },
    deliveryNote: { type: String, default: 'Pickup in Mahabaleshwar or local delivery' },
  },
  { timestamps: true }
);

productSchema.pre('save', function setSlug(next) {
  if (!this.slug && this.name) {
    this.slug = `${this.vertical}-${this.name}-${Date.now()}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
  }
  next();
});

export default mongoose.model('Product', productSchema);
