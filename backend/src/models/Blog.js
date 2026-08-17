import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, lowercase: true },
    excerpt: { type: String },
    content: { type: String },
    coverImage: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tags: [String],
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Blog', blogSchema);
