import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import FormLanguageToggle from '../../../components/common/FormLanguageToggle';
import { createCanvasser, fetchCanvasser, updateCanvasser } from '../../../services/canvasserApi';

function TermsModal({ open, title, items, closeLabel, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" onClick={onClose} role="presentation">
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button type="button" className="text-sm font-semibold text-slate-500" onClick={onClose}>
            {closeLabel}
          </button>
        </div>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

const defaultForm = {
  fullName: '',
  dateOfBirth: '',
  mobile: '',
  currentAddress: '',
  educationalQualification: '',
  totalWorkExperience: '',
  languagesKnown: '',
  ownVehicle: 'false',
  drivingLicense: 'false',
  joiningDate: '',
  termsAccepted: false,
  declarationAccepted: false,
  declarationDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

export default function CanvasserCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [termsOpen, setTermsOpen] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm({ defaultValues: defaultForm });
  const terms = t('canvasser.terms', { returnObjects: true });
  const termsList = Array.isArray(terms) ? terms : [];

  useEffect(() => {
    if (!editId) {
      setEditing(null);
      reset({
        ...defaultForm,
        declarationDate: new Date().toISOString().slice(0, 10),
      });
      setLoadingEdit(false);
      return;
    }

    setLoadingEdit(true);
    fetchCanvasser(editId)
      .then((row) => {
        setEditing(row);
        reset({
          fullName: row.fullName || '',
          dateOfBirth: row.dateOfBirth ? String(row.dateOfBirth).slice(0, 10) : '',
          mobile: row.mobile || row.whatsapp || '',
          currentAddress: row.currentAddress || '',
          educationalQualification: row.educationalQualification || '',
          totalWorkExperience: row.totalWorkExperience || '',
          languagesKnown: row.languagesKnown || '',
          ownVehicle: row.ownVehicle ? 'true' : 'false',
          drivingLicense: row.drivingLicense ? 'true' : 'false',
          joiningDate: row.joiningDate ? String(row.joiningDate).slice(0, 10) : '',
          termsAccepted: !!row.termsAccepted,
          declarationAccepted: !!row.declarationAccepted,
          declarationDate: row.declarationDate
            ? String(row.declarationDate).slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          notes: row.notes || '',
        });
      })
      .catch(() => {
        toast.error(t('canvasser.loadFailed'));
        navigate('/admin/canvasser-management', { replace: true });
      })
      .finally(() => setLoadingEdit(false));
  }, [editId, navigate, reset, t]);

  const onSubmit = async (data) => {
    if (!data.termsAccepted || !data.declarationAccepted) {
      toast.error(t('canvasser.termsAccept'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: data.fullName.trim(),
        dateOfBirth: data.dateOfBirth || undefined,
        mobile: data.mobile.trim(),
        whatsapp: data.mobile.trim(),
        currentAddress: data.currentAddress?.trim(),
        educationalQualification: data.educationalQualification?.trim(),
        totalWorkExperience: data.totalWorkExperience?.trim(),
        languagesKnown: data.languagesKnown?.trim(),
        ownVehicle: data.ownVehicle === 'true',
        drivingLicense: data.drivingLicense === 'true',
        joiningDate: data.joiningDate || undefined,
        termsAccepted: true,
        declarationAccepted: true,
        declarationDate: data.declarationDate || new Date().toISOString().slice(0, 10),
        notes: data.notes?.trim(),
      };

      if (editing) {
        await updateCanvasser(editing._id, payload);
        toast.success(t('canvasser.updated'));
      } else {
        await createCanvasser(payload);
        toast.success(t('canvasser.created'));
      }
      navigate('/admin/canvasser-management');
    } catch (e) {
      toast.error(e.response?.data?.message || t('canvasser.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loadingEdit) {
    return <div className="admin-card p-12 text-center text-slate-500">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? t('canvasser.editTitle') : t('canvasser.title')}
        subtitle={t('canvasser.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FormLanguageToggle />
            <Link to="/admin/canvasser-management" className="admin-btn-secondary">
              {t('canvasser.manageCta')}
            </Link>
          </div>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="admin-card space-y-6 p-6">
        <div>
          <h3 className="admin-card-title">{t('canvasser.formTitle')}</h3>
          <p className="text-sm text-slate-500">{t('canvasser.intro')}</p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2">
          <h4 className="sm:col-span-2 text-sm font-semibold text-slate-800">{t('canvasser.personalDetails')}</h4>
          <label className="text-sm text-slate-600 sm:col-span-2">
            {t('canvasser.fullName')} *
            <input className="admin-input mt-1" {...register('fullName', { required: true })} />
          </label>
          <label className="text-sm text-slate-600">
            {t('canvasser.dateOfBirth')}
            <input type="date" className="admin-input mt-1" {...register('dateOfBirth')} />
          </label>
          <label className="text-sm text-slate-600">
            {t('canvasser.mobile')} *
            <input className="admin-input mt-1" {...register('mobile', { required: true })} />
          </label>
          <label className="text-sm text-slate-600 sm:col-span-2">
            {t('canvasser.currentAddress')}
            <textarea className="admin-input mt-1" rows={2} {...register('currentAddress')} />
          </label>
          <label className="text-sm text-slate-600 sm:col-span-2">
            {t('canvasser.education')}
            <input className="admin-input mt-1" {...register('educationalQualification')} />
          </label>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <h4 className="sm:col-span-2 text-sm font-semibold text-slate-800">{t('canvasser.experienceSkills')}</h4>
          <label className="text-sm text-slate-600">
            {t('canvasser.totalExperience')}
            <input className="admin-input mt-1" {...register('totalWorkExperience')} />
          </label>
          <label className="text-sm text-slate-600">
            {t('canvasser.languagesKnown')}
            <input className="admin-input mt-1" {...register('languagesKnown')} />
          </label>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <h4 className="sm:col-span-3 text-sm font-semibold text-slate-800">{t('canvasser.otherDetails')}</h4>
          <label className="text-sm text-slate-600">
            {t('canvasser.ownVehicle')}
            <select className="admin-input mt-1" {...register('ownVehicle')}>
              <option value="true">{t('canvasser.yes')}</option>
              <option value="false">{t('canvasser.no')}</option>
            </select>
          </label>
          <label className="text-sm text-slate-600">
            {t('canvasser.drivingLicense')}
            <select className="admin-input mt-1" {...register('drivingLicense')}>
              <option value="true">{t('canvasser.yes')}</option>
              <option value="false">{t('canvasser.no')}</option>
            </select>
          </label>
          <label className="text-sm text-slate-600">
            {t('canvasser.joiningDate')}
            <input type="date" className="admin-input mt-1" {...register('joiningDate')} />
          </label>
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-800">{t('canvasser.termsTitle')}</h4>
          <button
            type="button"
            className="text-sm font-semibold text-primary underline"
            onClick={() => setTermsOpen(true)}
          >
            {t('canvasser.readFullTerms')}
          </button>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" {...register('termsAccepted', { required: true })} />
            <span>{t('canvasser.termsAccept')}</span>
          </label>
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-800">{t('canvasser.declarationTitle')}</h4>
          <p className="text-sm text-slate-600">{t('canvasser.declarationText')}</p>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" {...register('declarationAccepted', { required: true })} />
            <span>{t('canvasser.declarationAccept')}</span>
          </label>
          <label className="block max-w-xs text-sm text-slate-600">
            {t('canvasser.declarationDate')}
            <input type="date" className="admin-input mt-1" {...register('declarationDate')} />
          </label>
        </section>

        <label className="block text-sm text-slate-600">
          {t('canvasser.notes')}
          <textarea className="admin-input mt-1" rows={3} {...register('notes')} />
        </label>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="admin-btn-primary" disabled={saving || !watch('termsAccepted') || !watch('declarationAccepted')}>
            {saving ? t('common.loading') : editing ? t('canvasser.save') : t('canvasser.submit')}
          </button>
          {editing && (
            <Link to="/admin/canvasser-management" className="admin-btn-secondary">
              {t('common.cancel')}
            </Link>
          )}
        </div>
      </form>

      <TermsModal
        open={termsOpen}
        title={t('canvasser.termsTitle')}
        items={termsList}
        closeLabel={t('common.cancel')}
        onClose={() => setTermsOpen(false)}
      />
    </div>
  );
}
