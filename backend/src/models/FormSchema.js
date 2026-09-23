import mongoose from 'mongoose';

const FIELD_TYPES = ['text', 'email', 'tel', 'number', 'textarea', 'select', 'checkbox', 'date'];

const formFieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: FIELD_TYPES, default: 'text' },
    label: { type: String, required: true },
    placeholder: { type: String, default: '' },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    helpText: { type: String, default: '' },
  },
  { _id: false }
);

const formSectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    fields: { type: [formFieldSchema], default: [] },
  },
  { _id: false }
);

const formSchemaSchema = new mongoose.Schema(
  {
    formKind: {
      type: String,
      enum: ['customer', 'vendor'],
      required: true,
    },
    tenant: {
      type: String,
      enum: ['HOTEL', 'RESORT', 'HOMESTAY', 'GUIDE', 'TAXI', 'DRIVER', 'TENT', 'HORSE'],
      required: true,
    },
    sections: { type: [formSectionSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

formSchemaSchema.index({ formKind: 1, tenant: 1 }, { unique: true });

export const FORM_FIELD_TYPES = FIELD_TYPES;
export default mongoose.model('FormSchema', formSchemaSchema);
