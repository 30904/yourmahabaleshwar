import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '../../components/ui/Input';
import ListingImageField from './ListingImageField';
import Card from '../../components/ui/Card';
import { VEHICLE_TYPES } from './vendorListingFormConfig';

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

export default function TaxiRegistrationFields({ form, setField, isEdit = false }) {
  const { t, i18n } = useTranslation();
  const [legalDoc, setLegalDoc] = useState(null);

  const documents = t('taxiRegistration.documents', { returnObjects: true });
  const terms = t('taxiRegistration.terms', { returnObjects: true });
  const agreementSummary = t('taxiRegistration.agreementSummary', { returnObjects: true });
  const partnerAgreementSections = t('taxiRegistration.partnerAgreementSections', { returnObjects: true });
  const vehicleTypes = t('taxiRegistration.vehicleTypes', { returnObjects: true });
  const docList = Array.isArray(documents) ? documents : [];
  const termList = Array.isArray(terms) ? terms : [];
  const summaryList = Array.isArray(agreementSummary) ? agreementSummary : [];
  const vehicleTypeLabels = useMemo(() => {
    const list = Array.isArray(vehicleTypes) ? vehicleTypes : [];
    return Object.fromEntries(list.map((item) => [item.value, item.label]));
  }, [vehicleTypes, i18n.language]);

  const legalSections = useMemo(
    () => termList.map((body, index) => ({ heading: `${index + 1}.`, body })),
    [termList]
  );
  const agreementSections = useMemo(
    () => (Array.isArray(partnerAgreementSections) ? partnerAgreementSections : []),
    [partnerAgreementSections]
  );

  return (
    <>
      <Card className="space-y-4">
        <SectionTitle>{t('taxiRegistration.section1')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            className="sm:col-span-2"
            label={t('taxiRegistration.fleetBusinessName')}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />
          <Input
            className="sm:col-span-2"
            label={t('taxiRegistration.proprietorName')}
            value={form.operatorName}
            onChange={(e) => setField('operatorName', e.target.value)}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('taxiRegistration.gender')}</label>
            <select className="input-field" value={form.gender} onChange={(e) => setField('gender', e.target.value)} required>
              <option value="">{t('taxiRegistration.selectGender')}</option>
              <option value="MALE">{t('taxiRegistration.genderMale')}</option>
              <option value="FEMALE">{t('taxiRegistration.genderFemale')}</option>
              <option value="OTHER">{t('taxiRegistration.genderOther')}</option>
            </select>
          </div>
          <Input
            label={t('taxiRegistration.fatherOrHusbandName')}
            value={form.fatherOrHusbandName}
            onChange={(e) => setField('fatherOrHusbandName', e.target.value)}
            required
          />
          <Input
            label={t('taxiRegistration.dateOfBirth')}
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setField('dateOfBirth', e.target.value)}
            required
          />
          <Input
            label={t('taxiRegistration.pinCode')}
            value={form.pincode}
            onChange={(e) => setField('pincode', e.target.value)}
            required
          />
          <Input
            className="sm:col-span-2"
            label={t('taxiRegistration.officeAddress')}
            value={form.addressLine1}
            onChange={(e) => setField('addressLine1', e.target.value)}
            required
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('taxiRegistration.section2')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('taxiRegistration.primaryMobile')}
            value={form.primaryMobile}
            onChange={(e) => setField('primaryMobile', e.target.value)}
            required
          />
          <Input
            label={t('taxiRegistration.alternateMobile')}
            value={form.alternateMobile}
            onChange={(e) => setField('alternateMobile', e.target.value)}
          />
          <Input
            label={t('taxiRegistration.whatsapp')}
            value={form.whatsapp}
            onChange={(e) => setField('whatsapp', e.target.value)}
          />
          <Input
            label={t('taxiRegistration.email')}
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            required
          />
          <Input
            label={t('taxiRegistration.emergencyContactName')}
            value={form.emergencyContactName}
            onChange={(e) => setField('emergencyContactName', e.target.value)}
          />
          <Input
            label={t('taxiRegistration.emergencyMobile')}
            value={form.emergencyContactMobile}
            onChange={(e) => setField('emergencyContactMobile', e.target.value)}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('taxiRegistration.section3')}</SectionTitle>
        <p className="text-sm text-slate-600">{t('taxiRegistration.primaryVehicleHint')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('taxiRegistration.vehicleType')}</label>
            <select className="input-field" value={form.vehicleType} onChange={(e) => setField('vehicleType', e.target.value)} required>
              {VEHICLE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {vehicleTypeLabels[value] || value}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t('taxiRegistration.vehicleNumber')}
            value={form.vehicleNumber}
            onChange={(e) => setField('vehicleNumber', e.target.value)}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('taxiRegistration.licenseType')}</label>
            <select className="input-field" value={form.licenseType} onChange={(e) => setField('licenseType', e.target.value)}>
              <option value="">{t('taxiRegistration.select')}</option>
              <option value="LMV">{t('taxiRegistration.licenseLmv')}</option>
              <option value="COMMERCIAL">{t('taxiRegistration.licenseCommercial')}</option>
              <option value="MCWOG">{t('taxiRegistration.licenseMcwog')}</option>
            </select>
          </div>
          <Input
            label={t('taxiRegistration.drivingLicenseNumber')}
            value={form.drivingLicenseNumber}
            onChange={(e) => setField('drivingLicenseNumber', e.target.value)}
            required
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('taxiRegistration.section4')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('taxiRegistration.experienceYears')}
            type="number"
            min="0"
            value={form.experience}
            onChange={(e) => setField('experience', e.target.value)}
            required
          />
          <Input
            label={t('taxiRegistration.serviceArea')}
            value={form.serviceArea}
            onChange={(e) => setField('serviceArea', e.target.value)}
            required
          />
          <Input
            label={t('taxiRegistration.perTripPrice')}
            type="number"
            min="1"
            value={form.perTripPrice}
            onChange={(e) => setField('perTripPrice', e.target.value)}
            required
          />
          <Input
            label={t('taxiRegistration.hourlyRate')}
            type="number"
            min="1"
            value={form.hourlyRate}
            onChange={(e) => setField('hourlyRate', e.target.value)}
            required
          />
          <ListingImageField
            label={t('taxiRegistration.fleetPhotoUrl')}
            value={form.imageUrl}
            onChange={(url) => setField('imageUrl', url)}
            vertical="TAXI"
          />
          <p className="sm:col-span-2 text-xs text-slate-500">{t('taxiRegistration.commissionNote')}</p>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('taxiRegistration.section5')}</SectionTitle>
        <p className="text-sm text-slate-600">{t('taxiRegistration.documentsIntro')}</p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
          {docList.map((doc) => (
            <li key={doc}>{doc}</li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('taxiRegistration.section6')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('taxiRegistration.bankName')} value={form.bankName} onChange={(e) => setField('bankName', e.target.value)} required />
          <Input label={t('taxiRegistration.bankBranch')} value={form.bankBranch} onChange={(e) => setField('bankBranch', e.target.value)} />
          <Input
            className="sm:col-span-2"
            label={t('taxiRegistration.accountHolder')}
            value={form.accountHolder}
            onChange={(e) => setField('accountHolder', e.target.value)}
          />
          <Input label={t('taxiRegistration.accountNumber')} value={form.accountNumber} onChange={(e) => setField('accountNumber', e.target.value)} required />
          <Input label={t('taxiRegistration.ifsc')} value={form.ifsc} onChange={(e) => setField('ifsc', e.target.value)} required />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('taxiRegistration.section7')}</SectionTitle>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
          {summaryList.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 text-sm">
          <button
            type="button"
            className="font-semibold text-primary underline"
            onClick={() => setLegalDoc({ title: t('taxiRegistration.termsTitle'), sections: legalSections })}
          >
            {t('taxiRegistration.readFullTerms')}
          </button>
          <button
            type="button"
            className="font-semibold text-primary underline"
            onClick={() => setLegalDoc({ title: t('taxiRegistration.partnerAgreementTitle'), sections: agreementSections })}
          >
            {t('taxiRegistration.readPartnerAgreement')}
          </button>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={!!form.acceptTerms} onChange={(e) => setField('acceptTerms', e.target.checked)} />
          <span>{t('taxiRegistration.acceptTerms')}</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!form.acceptAgreement}
            onChange={(e) => setField('acceptAgreement', e.target.checked)}
          />
          <span>{t('taxiRegistration.acceptAgreement')}</span>
        </label>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('taxiRegistration.section8')}</SectionTitle>
        <p className="text-sm text-slate-600">{t('taxiRegistration.declaration')}</p>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!form.acceptDeclaration}
            onChange={(e) => setField('acceptDeclaration', e.target.checked)}
          />
          <span>{isEdit ? t('taxiRegistration.confirmDeclaration') : t('taxiRegistration.confirmDeclarationSubmit')}</span>
        </label>
      </Card>

      <LegalModal
        open={!!legalDoc}
        title={legalDoc?.title || ''}
        sections={legalDoc?.sections || []}
        closeLabel={t('taxiRegistration.close')}
        onClose={() => setLegalDoc(null)}
      />
    </>
  );
}
