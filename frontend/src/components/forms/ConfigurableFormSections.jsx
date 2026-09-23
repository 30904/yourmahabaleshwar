import { useEffect, useMemo, useState } from 'react';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { fetchPublicFormSchema } from '../../services/formSchemaApi';

export function useConfigurableForm(formKind, tenant) {
  const [schema, setSchema] = useState(null);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(Boolean(formKind && tenant));

  useEffect(() => {
    if (!formKind || !tenant) {
      setSchema(null);
      setValues({});
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    fetchPublicFormSchema(formKind, tenant)
      .then((doc) => {
        if (cancelled) return;
        setSchema(doc);
        const next = {};
        (doc?.sections || []).forEach((section) => {
          (section.fields || []).forEach((field) => {
            next[field.id] = field.type === 'checkbox' ? false : '';
          });
        });
        setValues(next);
      })
      .catch(() => {
        if (!cancelled) {
          setSchema(null);
          setValues({});
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formKind, tenant]);

  const setField = (id, value) => setValues((prev) => ({ ...prev, [id]: value }));

  const validate = () => {
    const sections = schema?.sections || [];
    for (const section of sections) {
      for (const field of section.fields || []) {
        if (!field.required) continue;
        const val = values[field.id];
        if (field.type === 'checkbox') {
          if (!val) return `${field.label} is required`;
        } else if (!String(val ?? '').trim()) {
          return `${field.label} is required`;
        }
      }
    }
    return null;
  };

  const customPayload = useMemo(() => {
    const out = {};
    Object.entries(values || {}).forEach(([k, v]) => {
      if (v === '' || v == null) return;
      out[k] = v;
    });
    return out;
  }, [values]);

  return { schema, values, setField, loading, validate, customPayload, sections: schema?.sections || [] };
}

export default function ConfigurableFormSections({
  formKind,
  tenant,
  sections: sectionsProp,
  values,
  onChange,
  className = '',
}) {
  const [sectionsState, setSectionsState] = useState([]);
  const sections = sectionsProp || sectionsState;

  useEffect(() => {
    if (sectionsProp || !formKind || !tenant) {
      if (!sectionsProp) setSectionsState([]);
      return undefined;
    }
    let cancelled = false;
    fetchPublicFormSchema(formKind, tenant)
      .then((doc) => {
        if (!cancelled) setSectionsState(Array.isArray(doc?.sections) ? doc.sections : []);
      })
      .catch(() => {
        if (!cancelled) setSectionsState([]);
      });
    return () => {
      cancelled = true;
    };
  }, [formKind, tenant, sectionsProp]);

  if (!sections.length) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {sections.map((section) => (
        <Card key={section.id} className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
            {section.description ? <p className="mt-1 text-xs text-slate-500">{section.description}</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(section.fields || []).map((field) => {
              const value = values?.[field.id] ?? (field.type === 'checkbox' ? false : '');
              if (field.type === 'textarea') {
                return (
                  <div key={field.id} className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {field.label}
                      {field.required ? ' *' : ''}
                    </label>
                    <textarea
                      className="input-field min-h-[88px]"
                      placeholder={field.placeholder || ''}
                      value={value}
                      required={field.required}
                      onChange={(e) => onChange(field.id, e.target.value)}
                    />
                  </div>
                );
              }
              if (field.type === 'select') {
                return (
                  <div key={field.id}>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {field.label}
                      {field.required ? ' *' : ''}
                    </label>
                    <select
                      className="input-field"
                      value={value}
                      required={field.required}
                      onChange={(e) => onChange(field.id, e.target.value)}
                    >
                      <option value="">Select</option>
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              if (field.type === 'checkbox') {
                return (
                  <label key={field.id} className="inline-flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={!!value}
                      onChange={(e) => onChange(field.id, e.target.checked)}
                    />
                    {field.label}
                    {field.required ? ' *' : ''}
                  </label>
                );
              }
              return (
                <Input
                  key={field.id}
                  label={`${field.label}${field.required ? ' *' : ''}`}
                  type={field.type === 'tel' ? 'tel' : field.type}
                  placeholder={field.placeholder || ''}
                  value={value}
                  required={field.required}
                  onChange={(e) => onChange(field.id, e.target.value)}
                />
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
