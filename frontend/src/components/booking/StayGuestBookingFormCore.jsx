import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import ImageUploadField from '../ui/ImageUploadField';
import FormLanguageToggle from '../common/FormLanguageToggle';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-slate-900">{children}</h3>;
}

export function StayLegalModal({ open, title, sections, closeLabel, onClose }) {
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

export default function StayGuestBookingFormCore({
  formTitle,
  formSubtitle,
  termsSummary,
  fullTermsTitle,
  fullTermsSections,
  acceptTermsLabel,
  form,
  setField,
  setTraveller,
  roomList,
  room,
  nights,
  subtotal,
  gst,
  total,
  dateBlocked,
  submitting,
  legalOpen,
  setLegalOpen,
  onSubmit,
  purposeName = 'purpose',
  idTypeName = 'idType',
  paymentModeName = 'paymentMode',
}) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const idTypes = useMemo(
    () => [
      ['AADHAAR', 'idAadhaar'],
      ['VOTER', 'idVoter'],
      ['DRIVING_LICENSE', 'idDrivingLicense'],
      ['PASSPORT', 'idPassport'],
    ],
    []
  );

  const purposes = useMemo(
    () => [
      ['TOURISM', 'purposeTourism'],
      ['BUSINESS', 'purposeBusiness'],
      ['PERSONAL', 'purposePersonal'],
    ],
    []
  );

  const paymentModes = useMemo(
    () => [
      ['CASH', 'payCash'],
      ['ONLINE', 'payOnline'],
      ['CARD', 'payCard'],
    ],
    []
  );

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{formTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{formSubtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FormLanguageToggle />
            <p className="text-sm text-slate-500">
              {t('stayGuestBooking.formDate')}: {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <Card className="space-y-4">
          <SectionTitle>{t('stayGuestBooking.sectionStayDates')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label={t('stayGuestBooking.checkInDate')} type="date" value={form.checkIn} onChange={(e) => setField('checkIn', e.target.value)} required />
            <Input label={t('stayGuestBooking.checkInTime')} type="time" value={form.checkInTime} onChange={(e) => setField('checkInTime', e.target.value)} />
            <Input label={t('stayGuestBooking.checkOutDate')} type="date" value={form.checkOut} onChange={(e) => setField('checkOut', e.target.value)} required />
            <Input label={t('stayGuestBooking.checkOutTime')} type="time" value={form.checkOutTime} onChange={(e) => setField('checkOutTime', e.target.value)} />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('stayGuestBooking.room')}</label>
              <select className="input-field" value={form.roomId} onChange={(e) => setField('roomId', e.target.value)}>
                {roomList.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} — {formatCurrency(r.basePrice)} {t('stayGuestBooking.perNight')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {dateBlocked && <p className="text-sm text-red-600">{t('booking.unavailable')}</p>}
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('stayGuestBooking.sectionLeadGuest')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input className="sm:col-span-2" label={t('stayGuestBooking.fullName')} value={form.leadFullName} onChange={(e) => setField('leadFullName', e.target.value)} required />
            <Input label={t('stayGuestBooking.age')} type="number" min="1" value={form.leadAge} onChange={(e) => setField('leadAge', e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('stayGuestBooking.gender')}</label>
              <select className="input-field" value={form.leadGender} onChange={(e) => setField('leadGender', e.target.value)}>
                <option value="">{t('stayGuestBooking.selectGender')}</option>
                <option value="M">{t('stayGuestBooking.genderMale')}</option>
                <option value="F">{t('stayGuestBooking.genderFemale')}</option>
                <option value="OTHER">{t('stayGuestBooking.genderOther')}</option>
              </select>
            </div>
            <Input label={t('stayGuestBooking.mobile')} value={form.leadMobile} onChange={(e) => setField('leadMobile', e.target.value)} required />
            <Input label={t('stayGuestBooking.email')} type="email" value={form.leadEmail} onChange={(e) => setField('leadEmail', e.target.value)} />
            <Input className="sm:col-span-2" label={t('stayGuestBooking.permanentAddress')} value={form.leadAddress} onChange={(e) => setField('leadAddress', e.target.value)} />
            <Input label={t('stayGuestBooking.cityState')} value={form.leadCityState} onChange={(e) => setField('leadCityState', e.target.value)} />
            <Input label={t('stayGuestBooking.pinCode')} value={form.leadPincode} onChange={(e) => setField('leadPincode', e.target.value)} />
            <Input label={t('stayGuestBooking.comingFrom')} value={form.comingFrom} onChange={(e) => setField('comingFrom', e.target.value)} />
            <Input label={t('stayGuestBooking.goingTo')} value={form.goingTo} onChange={(e) => setField('goingTo', e.target.value)} />
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-700">{t('stayGuestBooking.purposeOfVisit')}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                {purposes.map(([value, labelKey]) => (
                  <label key={value} className="inline-flex items-center gap-2">
                    <input type="radio" name={purposeName} checked={form.purpose === value} onChange={() => setField('purpose', value)} />
                    {t(`stayGuestBooking.${labelKey}`)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('stayGuestBooking.sectionIdProof')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-700">{t('stayGuestBooking.idType')}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                {idTypes.map(([value, labelKey]) => (
                  <label key={value} className="inline-flex items-center gap-2">
                    <input type="radio" name={idTypeName} checked={form.idType === value} onChange={() => setField('idType', value)} />
                    {t(`stayGuestBooking.${labelKey}`)}
                  </label>
                ))}
              </div>
            </div>
            <Input label={t('stayGuestBooking.idNumber')} value={form.idNumber} onChange={(e) => setField('idNumber', e.target.value)} required />
            <div className="sm:col-span-2">
              <ImageUploadField
                label={t('stayGuestBooking.idProofUpload')}
                hint={t('stayGuestBooking.idProofUploadHint')}
                value={form.idProofDocumentUrl || ''}
                onChange={(url) => setField('idProofDocumentUrl', url)}
                category="booking-id-proof"
                meta={{ userId: user?._id }}
                accept="image/jpeg,image/png,image/webp,application/pdf"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('stayGuestBooking.nationality')}</label>
              <select className="input-field" value={form.nationality} onChange={(e) => setField('nationality', e.target.value)}>
                <option value="INDIAN">{t('stayGuestBooking.nationalityIndian')}</option>
                <option value="OTHER">{t('stayGuestBooking.nationalityOther')}</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('stayGuestBooking.sectionCoTravellers')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('stayGuestBooking.adults')} type="number" min="1" value={form.adults} onChange={(e) => setField('adults', e.target.value)} />
            <Input label={t('stayGuestBooking.children')} type="number" min="0" value={form.children} onChange={(e) => setField('children', e.target.value)} />
          </div>
          <div className="space-y-3">
            {(form.coTravellers || []).map((c, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-4">
                <Input
                  className="sm:col-span-2"
                  label={t('stayGuestBooking.guestFullName', { n: index + 1 })}
                  value={c.fullName}
                  onChange={(e) => setTraveller(index, 'fullName', e.target.value)}
                />
                <Input label={t('stayGuestBooking.age')} type="number" min="0" value={c.age} onChange={(e) => setTraveller(index, 'age', e.target.value)} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('stayGuestBooking.gender')}</label>
                  <select className="input-field" value={c.gender} onChange={(e) => setTraveller(index, 'gender', e.target.value)}>
                    <option value="">{t('stayGuestBooking.selectGender')}</option>
                    <option value="M">{t('stayGuestBooking.genderShortMale')}</option>
                    <option value="F">{t('stayGuestBooking.genderShortFemale')}</option>
                    <option value="OTHER">{t('stayGuestBooking.genderOther')}</option>
                  </select>
                </div>
                <Input
                  className="sm:col-span-2"
                  label={t('stayGuestBooking.relationship')}
                  value={c.relationship}
                  onChange={(e) => setTraveller(index, 'relationship', e.target.value)}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('stayGuestBooking.sectionPayment')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">{t('stayGuestBooking.roomSummary')}</p>
              <p className="font-semibold text-slate-900">{room?.name || '—'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">{t('stayGuestBooking.totalNights')}</p>
              <p className="font-semibold text-slate-900">{nights}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">{t('stayGuestBooking.tariffPerNight')}</p>
              <p className="font-semibold text-slate-900">{formatCurrency(room?.basePrice || 0)}</p>
            </div>
            <Input
              label={t('stayGuestBooking.advanceAmount')}
              type="number"
              min="0"
              value={form.advanceAmount}
              onChange={(e) => setField('advanceAmount', e.target.value)}
              placeholder={String(total || '')}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t('stayGuestBooking.paymentMode')}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              {paymentModes.map(([value, labelKey]) => (
                <label key={value} className="inline-flex items-center gap-2">
                  <input type="radio" name={paymentModeName} checked={form.paymentMode === value} onChange={() => setField('paymentMode', value)} />
                  {t(`stayGuestBooking.${labelKey}`)}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{t('stayGuestBooking.paymentHint')}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>{t('stayGuestBooking.subtotalNights', { count: nights })}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>{t('stayGuestBooking.gstLabel')}</span>
              <span>{formatCurrency(gst)}</span>
            </div>
            <div className="mt-2 flex justify-between font-bold text-primary">
              <span>{t('stayGuestBooking.totalLabel')}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('stayGuestBooking.sectionTerms')}</SectionTitle>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            {(termsSummary || []).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button type="button" className="text-sm font-semibold text-primary underline" onClick={() => setLegalOpen(true)}>
            {t('stayGuestBooking.readFullTerms')}
          </button>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" checked={form.acceptTerms} onChange={(e) => setField('acceptTerms', e.target.checked)} />
            <span>{acceptTermsLabel}</span>
          </label>
        </Card>

        <Button type="submit" className="w-full sm:w-auto" disabled={dateBlocked || submitting || !roomList.length}>
          {submitting ? t('common.loading') : t('stayGuestBooking.confirmBooking')}
        </Button>
      </form>

      <StayLegalModal
        open={legalOpen}
        title={fullTermsTitle}
        sections={fullTermsSections}
        closeLabel={t('stayGuestBooking.close')}
        onClose={() => setLegalOpen(false)}
      />
    </>
  );
}
