import FormSchema from '../models/FormSchema.js';
import { success, error } from '../utils/apiResponse.js';

const TENANTS = ['HOTEL', 'RESORT', 'HOMESTAY', 'GUIDE', 'TAXI', 'DRIVER', 'TENT', 'HORSE'];
const FORM_KINDS = ['customer', 'vendor'];

const defaultSections = (formKind, tenant) => {
  const label = tenant.charAt(0) + tenant.slice(1).toLowerCase();
  if (formKind === 'customer') {
    return [
      {
        id: 'extra_details',
        title: 'Additional details',
        description: `Optional fields for ${label} customer booking forms. Edit or add cards/fields from admin.`,
        fields: [
          {
            id: 'admin_note',
            type: 'textarea',
            label: 'Anything else we should know?',
            placeholder: '',
            required: false,
            options: [],
            helpText: '',
          },
        ],
      },
    ];
  }
  return [
    {
      id: 'extra_vendor',
      title: 'Additional vendor details',
      description: `Optional fields for ${label} vendor registration. Edit or add cards/fields from admin.`,
      fields: [
        {
          id: 'business_notes',
          type: 'textarea',
          label: 'Business notes',
          placeholder: '',
          required: false,
          options: [],
          helpText: '',
        },
      ],
    },
  ];
};

export const getFormSchema = async (req, res) => {
  const { formKind, tenant } = req.query;
  if (formKind && tenant) {
    if (!FORM_KINDS.includes(formKind) || !TENANTS.includes(tenant)) {
      return error(res, 'Invalid formKind or tenant', 400);
    }
    let doc = await FormSchema.findOne({ formKind, tenant });
    if (!doc) {
      doc = await FormSchema.create({
        formKind,
        tenant,
        sections: defaultSections(formKind, tenant),
      });
    }
    return success(res, doc);
  }
  return success(res, await FormSchema.find().sort({ formKind: 1, tenant: 1 }));
};

export const upsertFormSchema = async (req, res) => {
  const { formKind, tenant, sections, isActive } = req.body || {};
  if (!FORM_KINDS.includes(formKind) || !TENANTS.includes(tenant)) {
    return error(res, 'Invalid formKind or tenant', 400);
  }
  if (!Array.isArray(sections)) {
    return error(res, 'sections must be an array', 400);
  }

  const normalized = sections.map((section, sIdx) => ({
    id: String(section.id || `section_${sIdx + 1}`).trim(),
    title: String(section.title || `Section ${sIdx + 1}`).trim(),
    description: String(section.description || ''),
    fields: Array.isArray(section.fields)
      ? section.fields.map((field, fIdx) => ({
          id: String(field.id || `field_${sIdx + 1}_${fIdx + 1}`).trim(),
          type: field.type || 'text',
          label: String(field.label || `Field ${fIdx + 1}`).trim(),
          placeholder: String(field.placeholder || ''),
          required: Boolean(field.required),
          options: Array.isArray(field.options) ? field.options.map(String).filter(Boolean) : [],
          helpText: String(field.helpText || ''),
        }))
      : [],
  }));

  const doc = await FormSchema.findOneAndUpdate(
    { formKind, tenant },
    {
      formKind,
      tenant,
      sections: normalized,
      isActive: isActive !== false,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return success(res, doc);
};

export const seedFormSchemas = async (req, res) => {
  const created = [];
  for (const formKind of FORM_KINDS) {
    for (const tenant of TENANTS) {
      const existing = await FormSchema.findOne({ formKind, tenant });
      if (existing) continue;
      await FormSchema.create({
        formKind,
        tenant,
        sections: defaultSections(formKind, tenant),
      });
      created.push(`${formKind}:${tenant}`);
    }
  }
  return success(res, { created, message: `Seeded ${created.length} form schemas` });
};
