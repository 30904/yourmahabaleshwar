import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    questionMr: { type: String },
    answer: { type: String, required: true },
    answerMr: { type: String },
    category: { type: String, default: 'GENERAL' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('FAQ', faqSchema);
