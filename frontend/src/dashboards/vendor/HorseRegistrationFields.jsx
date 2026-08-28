import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { defaultRoute } from './vendorListingFormConfig';

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-slate-900">{children}</h3>;
}

function LegalModal({ open, title, sections, closeLabel, onClose }) {
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
        <div className="mt-4 space-y-4 text-sm text-slate-700">
          {sections.map((section) => (
            <div key={section.heading}>
              <p className="font-semibold text-slate-900">{section.heading}</p>
              <p className="mt-1 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HorseRegistrationFields({
  form,
  setField,
  isEdit = false,
  addRoute,
  updateRoute,
  removeRoute,
}) {
  const { t, i18n } = useTranslation();
  const [legalDoc, setLegalDoc] = useState(null);

  const documents = t('horseRegistration.documents', { returnObjects: true });
  const terms = t('horseRegistration.terms', { returnObjects: true });
  const agreementSummary = t('horseRegistration.agreementSummary', { returnObjects: true });
  const partnerAgreementSections = t('horseRegistration.partnerAgreementSections', { returnObjects: true });
  const docList = Array.isArray(documents) ? documents : [];
  const termList = Array.isArray(terms) ? terms : [];
  const summaryList = Array.isArray(agreementSummary) ? agreementSummary : [];

  const legalSections = useMemo(
    () => termList.map((body, index) => ({ heading: `${index + 1}.`, body })),
    [termList, i18n.language]
  );

  const agreementSections = useMemo(
    () => (Array.isArray(partnerAgreementSections) ? partnerAgreementSections : []),
    [partnerAgreementSections, i18n.language]
  );

  return (
    <>
      <Card className="space-y-4">
        <SectionTitle>{t('horseRegistration.section1')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            className="sm:col-span-2"
            label={t('horseRegistration.operatorFullName')}
            value={form.operatorName}
            onChange={(e) => setField('operatorName', e.target.value)}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('horseRegistration.gender')}</label>
            <select className="input-field" value={form.gender} onChange={(e) => setField('gender', e.target.value)} required>
              <option value="">{t('horseRegistration.selectGender')}</option>
              <option value="MALE">{t('horseRegistration.genderMale')}</option>
              <option value="FEMALE">{t('horseRegistration.genderFemale')}</option>
              <option value="OTHER">{t('horseRegistration.genderOther')}</option>
            </select>
          </div>
          <Input
            label={t('horseRegistration.fatherOrHusbandName')}
            value={form.fatherOrHusbandName}
            onChange={(e) => setField('fatherOrHusbandName', e.target.value)}
            required
          />
          <Input
            label={t('horseRegistration.dateOfBirth')}
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setField('dateOfBirth', e.target.value)}
            required
          />
          <Input
            label={t('horseRegistration.pinCode')}
            value={form.pincode}
            onChange={(e) => setField('pincode', e.target.value)}
            required
          />
          <Input
            className="sm:col-span-2"
            label={t('horseRegistration.permanentAddress')}
            value={form.addressLine1}
            onChange={(e) => setField('addressLine1', e.target.value)}
            required
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('horseRegistration.section2')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('horseRegistration.primaryMobile')}
            value={form.primaryMobile}
            onChange={(e) => setField('primaryMobile', e.target.value)}
            required
          />
          <Input
            label={t('horseRegistration.alternateMobile')}
            value={form.alternateMobile}
            onChange={(e) => setField('alternateMobile', e.target.value)}
          />
          <Input label={t('horseRegistration.whatsapp')} value={form.whatsapp} onChange={(e) => setField('whatsapp', e.target.value)} />
          <Input label={t('horseRegistration.email')} type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required />
          <Input
            label={t('horseRegistration.emergencyContactName')}
            value={form.emergencyName}
            onChange={(e) => setField('emergencyName', e.target.value)}
          />
          <Input
            label={t('horseRegistration.emergencyMobile')}
            value={form.emergencyMobile}
            onChange={(e) => setField('emergencyMobile', e.target.value)}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('horseRegistration.section3')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            className="sm:col-span-2"
            label={t('horseRegistration.businessName')}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />
          <Input label={t('horseRegistration.location')} value={form.location} onChange={(e) => setField('location', e.target.value)} required />
          <Input
            label={t('horseRegistration.serviceArea')}
            value={form.serviceArea}
            onChange={(e) => setField('serviceArea', e.target.value)}
            required
          />
          <Input
            label={t('horseRegistration.horseCount')}
            type="number"
            min="1"
            value={form.horseCount}
            onChange={(e) => setField('horseCount', e.target.value)}
            required
          />
          <Input
            label={t('horseRegistration.experienceYears')}
            type="number"
            min="0"
            value={form.experience}
            onChange={(e) => setField('experience', e.target.value)}
          />
          <Input
            label={t('horseRegistration.slotsPerDay')}
            type="number"
            min="1"
            value={form.slotsPerDay}
            onChange={(e) => setField('slotsPerDay', e.target.value)}
          />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('horseRegistration.description')}</label>
            <textarea
              className="input-field min-h-[88px]"
              value={form.description || ''}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('horseRegistration.horseDetails')}</label>
            <textarea
              className="input-field min-h-[72px]"
              value={form.horseDetails || ''}
              onChange={(e) => setField('horseDetails', e.target.value)}
              placeholder={t('horseRegistration.horseDetailsPlaceholder')}
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-6 text-sm text-slate-700">
            <span className="font-medium">{t('horseRegistration.safetyGearProvided')}</span>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="safetyGearProvided"
                checked={form.safetyGearProvided === true}
                onChange={() => setField('safetyGearProvided', true)}
              />
              {t('horseRegistration.yes')}
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="safetyGearProvided"
                checked={form.safetyGearProvided === false}
                onChange={() => setField('safetyGearProvided', false)}
              />
              {t('horseRegistration.no')}
            </label>
          </div>
          <Input
            className="sm:col-span-2"
            label={t('horseRegistration.profilePhotoUrl')}
            value={form.imageUrl}
            onChange={(e) => setField('imageUrl', e.target.value)}
            placeholder="https://"
          />
          <p className="sm:col-span-2 text-xs text-slate-500">{t('horseRegistration.commissionNote')}</p>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle>{t('horseRegistration.section4')}</SectionTitle>
          <Button type="button" variant="outline" className="px-3 py-1.5 text-sm" onClick={() => addRoute(defaultRoute())}>
            <Plus size={14} /> {t('horseRegistration.addRoute')}
          </Button>
        </div>
        <div className="space-y-4">
          {(form.routes || []).map((route, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-3">
              <Input
                label={t('horseRegistration.routeName')}
                value={route.name}
                onChange={(e) => updateRoute(index, { name: e.target.value })}
              />
              <Input
                label={t('horseRegistration.durationMinutes')}
                type="number"
                min="1"
                value={route.durationMinutes}
                onChange={(e) => updateRoute(index, { durationMinutes: e.target.value })}
              />
              <div className="flex items-end gap-2">
                <Input
                  className="flex-1"
                  label={t('horseRegistration.routePrice')}
                  type="number"
                  min="1"
                  value={route.price}
                  onChange={(e) => updateRoute(index, { price: e.target.value })}
                />
                {(form.routes || []).length > 1 && (
                  <button
                    type="button"
                    className="mb-0.5 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeRoute(index)}
                    aria-label={t('horseRegistration.removeRoute')}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('horseRegistration.section5')}</SectionTitle>
        <p className="text-sm text-slate-600">{t('horseRegistration.documentsIntro')}</p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
          {docList.map((doc) => (
            <li key={doc}>{doc}</li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('horseRegistration.section6')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('horseRegistration.bankName')} value={form.bankName} onChange={(e) => setField('bankName', e.target.value)} required />
          <Input label={t('horseRegistration.bankBranch')} value={form.bankBranch} onChange={(e) => setField('bankBranch', e.target.value)} />
          <Input
            className="sm:col-span-2"
            label={t('horseRegistration.accountHolder')}
            value={form.accountHolder}
            onChange={(e) => setField('accountHolder', e.target.value)}
          />
          <Input label={t('horseRegistration.accountNumber')} value={form.accountNumber} onChange={(e) => setField('accountNumber', e.target.value)} required />
          <Input label={t('horseRegistration.ifsc')} value={form.ifsc} onChange={(e) => setField('ifsc', e.target.value)} required />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('horseRegistration.section7')}</SectionTitle>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
          {summaryList.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 text-sm">
          <button
            type="button"
            className="font-semibold text-primary underline"
            onClick={() => setLegalDoc({ title: t('horseRegistration.termsTitle'), sections: legalSections })}
          >
            {t('horseRegistration.readFullTerms')}
          </button>
          <button
            type="button"
            className="font-semibold text-primary underline"
            onClick={() => setLegalDoc({ title: t('horseRegistration.partnerAgreementTitle'), sections: agreementSections })}
          >
            {t('horseRegistration.readPartnerAgreement')}
          </button>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={!!form.acceptTerms} onChange={(e) => setField('acceptTerms', e.target.checked)} />
          <span>{t('horseRegistration.acceptTerms')}</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!form.acceptAgreement}
            onChange={(e) => setField('acceptAgreement', e.target.checked)}
          />
          <span>{t('horseRegistration.acceptAgreement')}</span>
        </label>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('horseRegistration.section8')}</SectionTitle>
        <p className="text-sm text-slate-600">{t('horseRegistration.declaration')}</p>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!form.acceptDeclaration}
            onChange={(e) => setField('acceptDeclaration', e.target.checked)}
          />
          <span>{isEdit ? t('horseRegistration.confirmDeclaration') : t('horseRegistration.confirmDeclarationSubmit')}</span>
        </label>
      </Card>

      <LegalModal
        open={!!legalDoc}
        title={legalDoc?.title}
        sections={legalDoc?.sections || []}
        closeLabel={t('horseRegistration.close')}
        onClose={() => setLegalDoc(null)}
      />
    </>
  );
}
