import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '../../components/ui/Input';
import ListingImageField from './ListingImageField';
import Card from '../../components/ui/Card';

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
          {(sections || []).map((section) => (
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

export default function HotelResortRegistrationFields({ form, setField, toggleAmenity, isEdit = false }) {
  const { t } = useTranslation();
  const [legalDoc, setLegalDoc] = useState(null);

  const amenities = t('stayRegistration.amenities', { returnObjects: true });
  const amenityList = Array.isArray(amenities) ? amenities : [];
  const termsSummary = t('hotelRegistration.termsSummary', { returnObjects: true });
  const termList = Array.isArray(termsSummary) ? termsSummary : [];
  const fullTermsSections = t('hotelRegistration.fullTermsSections', { returnObjects: true });
  const partnerAgreementSections = t('hotelRegistration.partnerAgreementSections', { returnObjects: true });

  const bookingTermsSections = useMemo(
    () => (Array.isArray(fullTermsSections) ? fullTermsSections : []),
    [fullTermsSections]
  );
  const agreementSections = useMemo(
    () => (Array.isArray(partnerAgreementSections) ? partnerAgreementSections : []),
    [partnerAgreementSections]
  );

  return (
    <>
      <Card className="space-y-4">
        <SectionTitle>{t('hotelRegistration.section1')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            className="sm:col-span-2"
            label={t('hotelRegistration.officialName')}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />
          <Input
            className="sm:col-span-2"
            label={t('stayRegistration.ownerName')}
            value={form.ownerName}
            onChange={(e) => setField('ownerName', e.target.value)}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('hotelRegistration.propertyType')}</label>
            <select className="input-field" value={form.type} onChange={(e) => setField('type', e.target.value)}>
              <option value="HOTEL">{t('hotelRegistration.typeHotel')}</option>
              <option value="RESORT">{t('hotelRegistration.typeResort')}</option>
            </select>
          </div>
          <Input label={t('stayRegistration.pinCode')} value={form.pincode} onChange={(e) => setField('pincode', e.target.value)} />
          <Input
            className="sm:col-span-2"
            label={t('stayRegistration.fullAddress')}
            value={form.addressLine1}
            onChange={(e) => setField('addressLine1', e.target.value)}
            required
          />
          <Input label={t('stayRegistration.cityDistrict')} value={form.city} onChange={(e) => setField('city', e.target.value)} />
          <Input
            label={t('stayRegistration.receptionPhone')}
            value={form.receptionPhone}
            onChange={(e) => setField('receptionPhone', e.target.value)}
            required
          />
          <Input label={t('stayRegistration.whatsapp')} value={form.whatsapp} onChange={(e) => setField('whatsapp', e.target.value)} />
          <Input
            label={t('stayRegistration.officialEmail')}
            type="email"
            value={form.propertyEmail}
            onChange={(e) => setField('propertyEmail', e.target.value)}
          />
          <Input
            label={t('stayRegistration.websiteSocial')}
            value={form.website}
            onChange={(e) => setField('website', e.target.value)}
            placeholder="https://"
          />
          <ListingImageField
            label={t('stayRegistration.imageUrl')}
            value={form.imageUrl}
            onChange={(url) => setField('imageUrl', url)}
            vertical={form.type === 'RESORT' ? 'RESORT' : 'HOTEL'}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('stayRegistration.section2')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label={t('stayRegistration.totalRooms')}
            type="number"
            min="0"
            value={form.totalRooms}
            onChange={(e) => setField('totalRooms', e.target.value)}
          />
          <Input
            label={t('stayRegistration.nonAcRooms')}
            type="number"
            min="0"
            value={form.nonAc}
            onChange={(e) => setField('nonAc', e.target.value)}
          />
          <Input
            label={t('stayRegistration.deluxeAcRooms')}
            type="number"
            min="0"
            value={form.deluxeAc}
            onChange={(e) => setField('deluxeAc', e.target.value)}
          />
          <Input
            label={t('stayRegistration.suiteRooms')}
            type="number"
            min="0"
            value={form.suite}
            onChange={(e) => setField('suite', e.target.value)}
          />
          <Input
            label={t('stayRegistration.familyDormRooms')}
            type="number"
            min="0"
            value={form.familyDorm}
            onChange={(e) => setField('familyDorm', e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('stayRegistration.driverAccommodation')}</label>
            <select
              className="input-field"
              value={form.driverAccommodation ? 'yes' : 'no'}
              onChange={(e) => setField('driverAccommodation', e.target.value === 'yes')}
            >
              <option value="no">{t('stayRegistration.no')}</option>
              <option value="yes">{t('stayRegistration.yes')}</option>
            </select>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">{t('stayRegistration.amenitiesLabel')}</p>
          <div className="flex flex-wrap gap-2">
            {amenityList.map((item) => {
              const value = item.value || item;
              const label = item.label || item;
              const on = (form.amenities || []).includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleAmenity(value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    on ? 'bg-blue-50 text-primary' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('stayRegistration.section3')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('stayRegistration.priceFrom')}
            type="number"
            min="1"
            value={form.priceRangeFrom}
            onChange={(e) => setField('priceRangeFrom', e.target.value)}
            required
          />
          <Input
            label={t('stayRegistration.priceTo')}
            type="number"
            min="1"
            value={form.priceRangeTo}
            onChange={(e) => setField('priceRangeTo', e.target.value)}
          />
          <Input
            label={t('stayRegistration.checkInTime')}
            type="time"
            value={form.checkInTime}
            onChange={(e) => setField('checkInTime', e.target.value)}
          />
          <Input
            label={t('stayRegistration.checkOutTime')}
            type="time"
            value={form.checkOutTime}
            onChange={(e) => setField('checkOutTime', e.target.value)}
          />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('stayRegistration.cancellationPolicy')}</label>
            <textarea
              className="input-field min-h-[72px]"
              value={form.cancellationPolicyText || ''}
              onChange={(e) => setField('cancellationPolicyText', e.target.value)}
            />
          </div>
          <p className="sm:col-span-2 text-xs text-slate-500">{t('stayRegistration.commissionNote')}</p>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('stayRegistration.section4')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('stayRegistration.bankName')}
            value={form.bankName}
            onChange={(e) => setField('bankName', e.target.value)}
            required
          />
          <Input label={t('stayRegistration.bankBranch')} value={form.bankBranch} onChange={(e) => setField('bankBranch', e.target.value)} />
          <Input
            className="sm:col-span-2"
            label={t('stayRegistration.accountHolder')}
            value={form.accountHolder}
            onChange={(e) => setField('accountHolder', e.target.value)}
          />
          <Input
            label={t('stayRegistration.accountNumber')}
            value={form.accountNumber}
            onChange={(e) => setField('accountNumber', e.target.value)}
            required
          />
          <Input label={t('stayRegistration.ifsc')} value={form.ifsc} onChange={(e) => setField('ifsc', e.target.value)} required />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('hotelRegistration.section5')}</SectionTitle>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
          {termList.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 text-sm">
          <button
            type="button"
            className="font-semibold text-primary underline"
            onClick={() => setLegalDoc({ title: t('hotelRegistration.fullTermsTitle'), sections: bookingTermsSections })}
          >
            {t('stayRegistration.readFullTerms')}
          </button>
          <button
            type="button"
            className="font-semibold text-primary underline"
            onClick={() => setLegalDoc({ title: t('hotelRegistration.partnerAgreementTitle'), sections: agreementSections })}
          >
            {t('stayRegistration.readPartnerAgreement')}
          </button>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!form.acceptTerms}
            onChange={(e) => setField('acceptTerms', e.target.checked)}
          />
          <span>{t('hotelRegistration.acceptTerms')}</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!form.acceptAgreement}
            onChange={(e) => setField('acceptAgreement', e.target.checked)}
          />
          <span>{t('hotelRegistration.acceptAgreement')}</span>
        </label>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t('stayRegistration.section6')}</SectionTitle>
        <p className="text-sm text-slate-600">{t('stayRegistration.declarationText')}</p>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!form.acceptDeclaration}
            onChange={(e) => setField('acceptDeclaration', e.target.checked)}
          />
          <span>{isEdit ? t('stayRegistration.confirmDeclaration') : t('stayRegistration.confirmDeclarationSubmit')}</span>
        </label>
      </Card>

      <LegalModal
        open={!!legalDoc}
        title={legalDoc?.title}
        sections={legalDoc?.sections}
        closeLabel={t('stayRegistration.close')}
        onClose={() => setLegalDoc(null)}
      />
    </>
  );
}
