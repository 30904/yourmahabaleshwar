import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import FormLanguageToggle from '../common/FormLanguageToggle';
import { calcGST, formatCurrency } from '../../utils/format';
import { createTentBooking } from '../../services/bookingsApi';
import { fetchAvailability } from '../../services/listingsApi';
import { payForBooking } from '../../services/paymentsApi';
import { useAuth } from '../../context/AuthContext';
import { StayLegalModal } from './StayGuestBookingFormCore';
import { useCoTravellerSync } from '../../hooks/useCoTravellerSync';

const OPEN_DEFAULT_PRICE_PER_NIGHT = 2000;

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-slate-900">{children}</h3>;
}

export default function TentGuestBookingForm({ item, openMode = false }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unavailable, setUnavailable] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  const [form, setForm] = useState(() => ({
    checkIn: '',
    checkOut: '',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    tentQuantity: 1,
    adults: 2,
    children: 0,
    leadFullName: user?.name || '',
    leadAge: '',
    leadGender: '',
    leadMobile: user?.phone || '',
    leadEmail: user?.email || '',
    leadAddress: '',
    leadCityState: 'Mahabaleshwar, Maharashtra',
    leadPincode: '',
    comingFrom: '',
    goingTo: '',
    purpose: 'TOURISM',
    idType: 'AADHAAR',
    idNumber: '',
    nationality: 'INDIAN',
    specialRequests: '',
    coTravellers: [],
    paymentMode: 'ONLINE',
    advanceAmount: '',
    acceptTerms: false,
  }));

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setTraveller = (index, key, value) => {
    setForm((prev) => {
      const next = [...(prev.coTravellers || [])];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, coTravellers: next };
    });
  };

  const pricePerNight = openMode ? OPEN_DEFAULT_PRICE_PER_NIGHT : item?.pricePerNight || 0;
  const tentLabel = openMode ? t('tentGuestBooking.standardCamp') : item?.name || t('tentGuestBooking.standardCamp');

  const nights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 1;
    return Math.max(1, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000));
  }, [form.checkIn, form.checkOut]);

  const tentQuantity = Number(form.tentQuantity) || 1;
  const subtotal = pricePerNight * nights * tentQuantity;
  const gst = calcGST(subtotal);
  const total = subtotal + gst;
  const dateBlocked = form.checkIn && unavailable.includes(form.checkIn);

  const termsSummary = useMemo(() => {
    const lines = t('tentGuestBooking.termsSummary', { returnObjects: true });
    return Array.isArray(lines) ? lines : [];
  }, [t, i18n.language]);

  const fullTermsSections = useMemo(() => {
    const sections = t('tentGuestBooking.fullTermsSections', { returnObjects: true });
    return Array.isArray(sections) ? sections : [];
  }, [t, i18n.language]);

  useCoTravellerSync(form.adults, form.children, setForm);

  useEffect(() => {
    if (openMode || !item?._id || !form.checkIn) return;
    fetchAvailability('tent', item._id, form.checkIn, form.checkOut || form.checkIn)
      .then((d) => setUnavailable(d.unavailable || []))
      .catch(() => setUnavailable([]));
  }, [openMode, item?._id, form.checkIn, form.checkOut]);

  const validate = () => {
    if (!form.checkIn || !form.checkOut) return t('stayGuestBooking.validation.datesRequired');
    if (dateBlocked) return t('booking.unavailable');
    if (tentQuantity < 1) return t('tentGuestBooking.validation.tentQuantity');
    if (!String(form.leadFullName || '').trim()) return t('stayGuestBooking.validation.fullName');
    if (!String(form.leadMobile || '').trim()) return t('stayGuestBooking.validation.mobile');
    if (!String(form.idType || '').trim() || !String(form.idNumber || '').trim()) {
      return t('stayGuestBooking.validation.idProof');
    }
    if (Number(form.adults) < 1) return t('stayGuestBooking.validation.adults');
    if (!form.acceptTerms) return t('stayGuestBooking.validation.acceptTerms');
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const res = await createTentBooking({
        open: openMode,
        tentId: openMode ? undefined : item._id,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        tentQuantity,
        guestRegistration: {
          formDate: new Date().toISOString(),
          checkInTime: form.checkInTime,
          checkOutTime: form.checkOutTime,
          adults: Number(form.adults) || 1,
          children: Number(form.children) || 0,
          notes: form.specialRequests,
          leadGuest: {
            fullName: form.leadFullName,
            age: form.leadAge ? Number(form.leadAge) : undefined,
            gender: form.leadGender || '',
            mobile: form.leadMobile,
            email: form.leadEmail,
            address: form.leadAddress,
            cityState: form.leadCityState,
            pincode: form.leadPincode,
            comingFrom: form.comingFrom,
            goingTo: form.goingTo,
            purpose: form.purpose || 'TOURISM',
          },
          idProof: {
            type: form.idType,
            number: form.idNumber,
            nationality: form.nationality || 'INDIAN',
          },
          coTravellers: (form.coTravellers || []).filter((c) => String(c.fullName || '').trim()),
          tentLabel,
          totalNights: nights,
          tariff: pricePerNight,
          advanceAmount: form.advanceAmount !== '' ? Number(form.advanceAmount) : total,
          paymentMode: form.paymentMode || 'ONLINE',
          acceptTerms: true,
          acceptedTermsAt: new Date().toISOString(),
        },
      });
      const booking = res.data.data;
      toast.success(openMode ? t('serviceBooking.requestSubmitted') : t('tentGuestBooking.bookingCreated'));
      if (!openMode) {
        try {
          await payForBooking(booking, user);
          toast.success(t('tentGuestBooking.paymentSuccess'));
        } catch {
          toast(t('tentGuestBooking.bookingSavedPayLater'));
        }
      }
      navigate('/dashboard/customer/bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || t('tentGuestBooking.bookingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const idTypes = [
    ['AADHAAR', 'idAadhaar'],
    ['VOTER', 'idVoter'],
    ['DRIVING_LICENSE', 'idDrivingLicense'],
    ['PASSPORT', 'idPassport'],
  ];

  const purposes = [
    ['TOURISM', 'purposeTourism'],
    ['BUSINESS', 'purposeBusiness'],
    ['PERSONAL', 'purposePersonal'],
  ];

  const paymentModes = [
    ['CASH', 'payCash'],
    ['ONLINE', 'payOnline'],
    ['CARD', 'payCard'],
  ];

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className={`flex flex-wrap items-end gap-3 ${openMode ? 'service-booking-form-toolbar' : 'justify-between'}`}>
          {!openMode && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t('tentGuestBooking.formTitle')}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('tentGuestBooking.formSubtitle', { name: item?.name })}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <FormLanguageToggle />
            <p className="form-date text-sm text-slate-500">
              {t('stayGuestBooking.formDate')}: {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <Card className="space-y-4">
          <SectionTitle>{t('tentGuestBooking.sectionStay')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label={t('stayGuestBooking.checkInDate')}
              type="date"
              value={form.checkIn}
              onChange={(e) => setField('checkIn', e.target.value)}
              required
            />
            <Input
              label={t('stayGuestBooking.checkInTime')}
              type="time"
              value={form.checkInTime}
              onChange={(e) => setField('checkInTime', e.target.value)}
            />
            <Input
              label={t('stayGuestBooking.checkOutDate')}
              type="date"
              value={form.checkOut}
              onChange={(e) => setField('checkOut', e.target.value)}
              required
            />
            <Input
              label={t('stayGuestBooking.checkOutTime')}
              type="time"
              value={form.checkOutTime}
              onChange={(e) => setField('checkOutTime', e.target.value)}
            />
            <Input
              label={t('tentGuestBooking.tentQuantity')}
              type="number"
              min="1"
              max="20"
              value={form.tentQuantity}
              onChange={(e) => setField('tentQuantity', e.target.value)}
              required
            />
            {openMode && (
              <p className="sm:col-span-2 lg:col-span-3 text-sm text-slate-500">
                {t('tentGuestBooking.openPriceHint', { price: formatCurrency(pricePerNight) })}
              </p>
            )}
          </div>
          {dateBlocked && <p className="text-sm text-red-600">{t('booking.unavailable')}</p>}
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('stayGuestBooking.sectionLeadGuest')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              className="sm:col-span-2"
              label={t('stayGuestBooking.fullName')}
              value={form.leadFullName}
              onChange={(e) => setField('leadFullName', e.target.value)}
              required
            />
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
                    <input type="radio" name="purpose" checked={form.purpose === value} onChange={() => setField('purpose', value)} />
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
                    <input type="radio" name="idType" checked={form.idType === value} onChange={() => setField('idType', value)} />
                    {t(`stayGuestBooking.${labelKey}`)}
                  </label>
                ))}
              </div>
            </div>
            <Input label={t('stayGuestBooking.idNumber')} value={form.idNumber} onChange={(e) => setField('idNumber', e.target.value)} required />
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
          <SectionTitle>{t('tentGuestBooking.sectionGuests')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('stayGuestBooking.adults')} type="number" min="1" value={form.adults} onChange={(e) => setField('adults', e.target.value)} />
            <Input label={t('stayGuestBooking.children')} type="number" min="0" value={form.children} onChange={(e) => setField('children', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('tentGuestBooking.specialRequests')}</label>
            <textarea
              className="input-field min-h-[88px]"
              value={form.specialRequests}
              onChange={(e) => setField('specialRequests', e.target.value)}
            />
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
          <SectionTitle>{t('tentGuestBooking.sectionPayment')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">{t('tentGuestBooking.campType')}</p>
              <p className="font-semibold text-slate-900">{tentLabel}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">{t('stayGuestBooking.totalNights')}</p>
              <p className="font-semibold text-slate-900">{nights}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">{t('tentGuestBooking.tentsBooked')}</p>
              <p className="font-semibold text-slate-900">{tentQuantity}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">{t('stayGuestBooking.tariffPerNight')}</p>
              <p className="font-semibold text-slate-900">{formatCurrency(pricePerNight)}</p>
            </div>
            <Input
              className="sm:col-span-2 lg:col-span-4"
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
                  <input type="radio" name="paymentMode" checked={form.paymentMode === value} onChange={() => setField('paymentMode', value)} />
                  {t(`stayGuestBooking.${labelKey}`)}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{t('stayGuestBooking.paymentHint')}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>{t('stayGuestBooking.subtotalNights', { count: nights })} × {tentQuantity}</span>
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
            {termsSummary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button type="button" className="text-sm font-semibold text-primary underline" onClick={() => setLegalOpen(true)}>
            {t('stayGuestBooking.readFullTerms')}
          </button>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" checked={form.acceptTerms} onChange={(e) => setField('acceptTerms', e.target.checked)} />
            <span>{t('tentGuestBooking.acceptTerms')}</span>
          </label>
        </Card>

        <Button type="submit" className="w-full sm:w-auto" disabled={dateBlocked || submitting}>
          {submitting
            ? t('common.loading')
            : openMode
              ? t('serviceBooking.submitRequest')
              : t('tentGuestBooking.confirmBooking')}
        </Button>
      </form>

      <StayLegalModal
        open={legalOpen}
        title={t('tentGuestBooking.fullTermsTitle')}
        sections={fullTermsSections}
        closeLabel={t('stayGuestBooking.close')}
        onClose={() => setLegalOpen(false)}
      />
    </>
  );
}
