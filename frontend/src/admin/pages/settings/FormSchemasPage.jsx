import { useEffect, useMemo, useState } from 'react';
import { HOMESTAY_VILLA } from '../../../constants/homestayVillaLabels';
import toast from 'react-hot-toast';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import {
  fetchAdminFormSchema,
  saveAdminFormSchema,
  seedAdminFormSchemas,
} from '../../../services/formSchemaApi';

export const FORM_TENANTS = [
  { id: 'HOTEL', label: 'Hotels' },
  { id: 'RESORT', label: 'Resorts' },
  { id: 'HOMESTAY', label: HOMESTAY_VILLA.plural },
  { id: 'GUIDE', label: 'Guides' },
  { id: 'TAXI', label: 'Taxi' },
  { id: 'DRIVER', label: 'Drivers' },
  { id: 'TENT', label: 'Tents' },
  { id: 'HORSE', label: 'Horses' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
];

const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

function emptyField() {
  return {
    id: uid('field'),
    type: 'text',
    label: 'New field',
    placeholder: '',
    required: false,
    options: [],
    helpText: '',
  };
}

function emptySection(index = 1) {
  return {
    id: uid('section'),
    title: `Card ${index}`,
    description: '',
    fields: [emptyField()],
  };
}

export default function FormSchemasPage({ formKind = 'customer' }) {
  const [tenant, setTenant] = useState('');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const title = formKind === 'vendor' ? 'Vendor Forms' : 'Customer Forms';
  const subtitle =
    formKind === 'vendor'
      ? 'Select a vendor type, then add cards and input fields for that registration form.'
      : 'Select a service type, then add cards and input fields for that customer booking form.';

  const selectedLabel = useMemo(
    () => FORM_TENANTS.find((t) => t.id === tenant)?.label || '',
    [tenant]
  );

  useEffect(() => {
    if (!tenant) {
      setSections([]);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    fetchAdminFormSchema(formKind, tenant)
      .then((doc) => {
        if (cancelled) return;
        setSections(Array.isArray(doc?.sections) ? doc.sections : []);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Failed to load form schema');
          setSections([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formKind, tenant]);

  const updateSection = (sectionId, patch) => {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)));
  };

  const updateField = (sectionId, fieldId, patch) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              fields: (s.fields || []).map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
            }
      )
    );
  };

  const onSave = async () => {
    if (!tenant) return;
    setSaving(true);
    try {
      await saveAdminFormSchema({ formKind, tenant, sections, isActive: true });
      toast.success('Form saved');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onSeed = async () => {
    try {
      const res = await seedAdminFormSchemas();
      toast.success(res?.message || 'Defaults seeded');
      if (tenant) {
        const doc = await fetchAdminFormSchema(formKind, tenant);
        setSections(Array.isArray(doc?.sections) ? doc.sections : []);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Seed failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onSeed}>
              Seed defaults
            </Button>
            <Button type="button" onClick={onSave} disabled={!tenant || saving || loading}>
              {saving ? 'Saving…' : 'Save form'}
            </Button>
          </div>
        }
      />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tenants</p>
        <div className="flex flex-wrap gap-2">
          {FORM_TENANTS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTenant(t.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                tenant === t.id
                  ? 'bg-primary text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!tenant && (
        <Card className="p-8 text-center text-sm text-slate-500">
          Select a tenant above to edit that form.
        </Card>
      )}

      {tenant && loading && (
        <Card className="p-8 text-center text-sm text-slate-500">Loading {selectedLabel} form…</Card>
      )}

      {tenant && !loading && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Editing <span className="font-semibold text-slate-900">{selectedLabel}</span> {formKind} form
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSections((prev) => [...prev, emptySection(prev.length + 1)])}
            >
              <Plus size={16} className="mr-1" /> Add card
            </Button>
          </div>

          {sections.length === 0 && (
            <Card className="p-6 text-center text-sm text-slate-500">
              No cards yet. Click <strong>Add card</strong> to create one.
            </Card>
          )}

          {sections.map((section, sIdx) => (
            <Card key={section.id} className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <GripVertical className="mt-2 shrink-0 text-slate-300" size={18} />
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Card title"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                  />
                  <Input
                    label="Card description (optional)"
                    value={section.description || ''}
                    onChange={(e) => updateSection(section.id, { description: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  className="mt-7 rounded-lg p-2 text-red-500 hover:bg-red-50"
                  onClick={() => setSections((prev) => prev.filter((s) => s.id !== section.id))}
                  aria-label="Delete card"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fields · card {sIdx + 1}
                  </p>
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary"
                    onClick={() =>
                      updateSection(section.id, {
                        fields: [...(section.fields || []), emptyField()],
                      })
                    }
                  >
                    + Add field
                  </button>
                </div>

                {(section.fields || []).map((field) => (
                  <div
                    key={field.id}
                    className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    <Input
                      label="Label"
                      value={field.label}
                      onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                    />
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
                      <select
                        className="input-field"
                        value={field.type}
                        onChange={(e) => updateField(section.id, field.id, { type: e.target.value })}
                      >
                        {FIELD_TYPES.map((ft) => (
                          <option key={ft.value} value={ft.value}>
                            {ft.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Placeholder"
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(section.id, field.id, { placeholder: e.target.value })}
                    />
                    <div className="flex items-end justify-between gap-2">
                      <label className="inline-flex items-center gap-2 pb-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={!!field.required}
                          onChange={(e) => updateField(section.id, field.id, { required: e.target.checked })}
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        onClick={() =>
                          updateSection(section.id, {
                            fields: (section.fields || []).filter((f) => f.id !== field.id),
                          })
                        }
                        aria-label="Delete field"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {field.type === 'select' && (
                      <Input
                        className="sm:col-span-2 lg:col-span-4"
                        label="Dropdown options (comma separated)"
                        value={(field.options || []).join(', ')}
                        onChange={(e) =>
                          updateField(section.id, field.id, {
                            options: e.target.value
                              .split(',')
                              .map((o) => o.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
