import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const LANGUAGE_VALUES = [
  { value: 'Marathi', labelKey: 'langMarathi' },
  { value: 'Hindi', labelKey: 'langHindi' },
  { value: 'English', labelKey: 'langEnglish' },
];

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

export default function GuideRegistrationFields({ form, setField, toggleLanguage, isEdit = false }) {
  const { t } = useTranslation();
  const [legalOpen, setLegalOpen] = useState(false);

  const documents = t('guideRegistration.documents', { returnObjects: true });
  const terms = t('guideRegistration.terms', { returnObjects: true });
  const docList = Array.isArray(documents) ? documents : [];
  const termList = Array.isArray(terms) ? terms : [];

  const legalSections = useMemo(
    () => termList.map((body, index) => ({ heading: `${index + 1}.`, body })),
    [termList]
  );

  return (
    <>
      <Card className="space-y-4">
        <SectionTitle>{t('guideRegistration.section1')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            className="sm:col-span-2"
            label={t('guideRegistration.fullName')}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('guideRegistration.gender')}</label>
            <select className="input-field" value={form.gender} onChange={(e) => setField('gender', e.target.value)} required>
              <option value="">{t('guideRegistration.selectGender')}</option>
              <option value="MALE">{t('guideRegistration.genderMale')}</option>
              <option value="FEMALE">{t('guideRegistration.genderFemale')}</option>
              <option value="OTHER">{t('guideRegistration.genderOther')}</option>
            </select>
          </div>
          <Input
            label={t('guideRegistration.fatherOrHusbandName')}
            value={form.fatherOrHusbandName}
            onChange={(e) => setField('fatherOrHusbandName', e.target.value)}
            required
          />
          <Input
            label={t('guideRegistration.dateOfBirth')}
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setField('dateOfBirth', e.target.value)}
            required
          />
          <Input
            label={t('guideRegistration.pinCode')}
            value={form.pincode}
            onChange={(e) => setField('pincode', e.target.value)}
            required
          />
          <Input
            className="sm:col-span-2"
            label={t('guideRegistration.permanentAddress')}
            value={form.addressLine1}
            onChange={(e) => setField('addressLine1', e.target.value)}
            required
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('guideRegistration.section2')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('guideRegistration.primaryMobile')}
            value={form.primaryMobile}
            onChange={(e) => setField('primaryMobile', e.target.value)}
            required
          />
          <Input
            label={t('guideRegistration.alternateMobile')}
            value={form.alternateMobile}
            onChange={(e) => setField('alternateMobile', e.target.value)}
          />
          <Input
            label={t('guideRegistration.whatsapp')}
            value={form.whatsapp}
            onChange={(e) => setField('whatsapp', e.target.value)}
          />
          <Input
            label={t('guideRegistration.email')}
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            required
          />
          <Input
            label={t('guideRegistration.emergencyContactName')}
            value={form.emergencyContactName}
            onChange={(e) => setField('emergencyContactName', e.target.value)}
          />
          <Input
            label={t('guideRegistration.emergencyMobile')}
            value={form.emergencyContactMobile}
            onChange={(e) => setField('emergencyContactMobile', e.target.value)}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('guideRegistration.section3')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('guideRegistration.ownTwoWheeler')}</label>
            <select
              className="input-field"
              value={form.ownsTwoWheeler}
              onChange={(e) => setField('ownsTwoWheeler', e.target.value)}
            >
              <option value="">{t('guideRegistration.select')}</option>
              <option value="yes">{t('guideRegistration.yes')}</option>
              <option value="no">{t('guideRegistration.no')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('guideRegistration.ownFourWheeler')}</label>
            <select
              className="input-field"
              value={form.ownsFourWheeler}
              onChange={(e) => setField('ownsFourWheeler', e.target.value)}
            >
              <option value="">{t('guideRegistration.select')}</option>
              <option value="yes">{t('guideRegistration.yes')}</option>
              <option value="no">{t('guideRegistration.no')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('guideRegistration.drivingSkill')}</label>
            <select
              className="input-field"
              value={form.drivingSkill}
              onChange={(e) => setField('drivingSkill', e.target.value)}
            >
              <option value="">{t('guideRegistration.select')}</option>
              <option value="TWO_WHEELER">{t('guideRegistration.skillTwoWheeler')}</option>
              <option value="FOUR_WHEELER">{t('guideRegistration.skillFourWheeler')}</option>
              <option value="BOTH">{t('guideRegistration.skillBoth')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('guideRegistration.licenseType')}</label>
            <select
              className="input-field"
              value={form.licenseType}
              onChange={(e) => setField('licenseType', e.target.value)}
            >
              <option value="">{t('guideRegistration.select')}</option>
              <option value="MCWOG">{t('guideRegistration.licenseMcwog')}</option>
              <option value="LMV">{t('guideRegistration.licenseLmv')}</option>
              <option value="COMMERCIAL">{t('guideRegistration.licenseCommercial')}</option>
            </select>
          </div>
          <Input
            className="sm:col-span-2"
            label={t('guideRegistration.drivingLicenseNumber')}
            value={form.drivingLicenseNumber}
            onChange={(e) => setField('drivingLicenseNumber', e.target.value)}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('guideRegistration.section4')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('guideRegistration.experienceYears')}
            type="number"
            min="0"
            value={form.experience}
            onChange={(e) => setField('experience', e.target.value)}
            required
          />
          <Input
            label={t('guideRegistration.mainTourismArea')}
            value={form.mainTourismArea}
            onChange={(e) => setField('mainTourismArea', e.target.value)}
            required
          />
          <Input
            className="sm:col-span-2"
            label={t('guideRegistration.specialties')}
            value={form.specialties}
            onChange={(e) => setField('specialties', e.target.value)}
            placeholder={t('guideRegistration.specialtiesPlaceholder')}
          />
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-slate-700">{t('guideRegistration.languagesKnown')}</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_VALUES.map(({ value, labelKey }) => {
                const on = (form.languages || []).includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleLanguage(value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      on ? 'bg-blue-50 text-primary' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {t(`guideRegistration.${labelKey}`)}
                  </button>
                );
              })}
            </div>
          </div>
          <Input
            className="sm:col-span-2"
            label={t('guideRegistration.otherLanguages')}
            value={form.otherLanguages}
            onChange={(e) => setField('otherLanguages', e.target.value)}
            placeholder={t('guideRegistration.otherLanguagesPlaceholder')}
          />
          <Input
            className="sm:col-span-2"
            label={t('guideRegistration.bio')}
            value={form.bio}
            onChange={(e) => setField('bio', e.target.value)}
          />
          <Input
            label={t('guideRegistration.package6hr')}
            type="number"
            min="1"
            value={form.package6hr}
            onChange={(e) => setField('package6hr', e.target.value)}
            required
          />
          <Input
            label={t('guideRegistration.package12hr')}
            type="number"
            min="1"
            value={form.package12hr}
            onChange={(e) => setField('package12hr', e.target.value)}
            required
          />
          <Input
            label={t('guideRegistration.bikeAddon')}
            type="number"
            min="0"
            value={form.bikeAddonPrice}
            onChange={(e) => setField('bikeAddonPrice', e.target.value)}
          />
          <Input
            className="sm:col-span-2"
            label={t('guideRegistration.profilePhotoUrl')}
            value={form.imageUrl}
            onChange={(e) => setField('imageUrl', e.target.value)}
            placeholder="https://"
          />
          <p className="sm:col-span-2 text-xs text-slate-500">{t('guideRegistration.commissionNote')}</p>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('guideRegistration.section5')}</SectionTitle>
        <p className="text-sm text-slate-600">{t('guideRegistration.documentsIntro')}</p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
          {docList.map((doc) => (
            <li key={doc}>{doc}</li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('guideRegistration.section6')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('guideRegistration.bankName')}
            value={form.bankName}
            onChange={(e) => setField('bankName', e.target.value)}
            required
          />
          <Input
            label={t('guideRegistration.bankBranch')}
            value={form.bankBranch}
            onChange={(e) => setField('bankBranch', e.target.value)}
          />
          <Input
            className="sm:col-span-2"
            label={t('guideRegistration.accountHolder')}
            value={form.accountHolder}
            onChange={(e) => setField('accountHolder', e.target.value)}
          />
          <Input
            label={t('guideRegistration.accountNumber')}
            value={form.accountNumber}
            onChange={(e) => setField('accountNumber', e.target.value)}
            required
          />
          <Input
            label={t('guideRegistration.ifsc')}
            value={form.ifsc}
            onChange={(e) => setField('ifsc', e.target.value)}
            required
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('guideRegistration.section7')}</SectionTitle>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
          {termList.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 text-sm">
          <button
            type="button"
            className="font-semibold text-primary underline"
            onClick={() => setLegalOpen(true)}
          >
            {t('guideRegistration.readFullTerms')}
          </button>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!form.acceptTerms}
            onChange={(e) => setField('acceptTerms', e.target.checked)}
          />
          <span>{t('guideRegistration.acceptTerms')}</span>
        </label>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('guideRegistration.section8')}</SectionTitle>
        <p className="text-sm text-slate-600">{t('guideRegistration.declaration')}</p>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!form.acceptDeclaration}
            onChange={(e) => setField('acceptDeclaration', e.target.checked)}
          />
          <span>{isEdit ? t('guideRegistration.confirmDeclaration') : t('guideRegistration.confirmDeclarationSubmit')}</span>
        </label>
      </Card>

      <LegalModal
        open={legalOpen}
        title={t('guideRegistration.termsTitle')}
        sections={legalSections}
        closeLabel={t('guideRegistration.close')}
        onClose={() => setLegalOpen(false)}
      />
    </>
  );
}
