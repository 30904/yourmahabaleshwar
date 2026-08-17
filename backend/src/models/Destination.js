import mongoose from 'mongoose';

const destinationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String },
    descriptionMr: { type: String },
    image: { type: String },
    region: { type: String, default: 'Mahabaleshwar' },
    latitude: { type: Number },
    longitude: { type: Number },
    popularityScore: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

destinationSchema.pre('save', function setSlug(next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  next();
});

export default mongoose.model('Destination', destinationSchema);
