import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import FormLanguageToggle from '../common/FormLanguageToggle';
import { calcGST, formatCurrency } from '../../utils/format';
import { createTaxiBooking } from '../../services/bookingsApi';
import { fetchAvailability } from '../../services/listingsApi';
import { payForBooking } from '../../services/paymentsApi';
import { useAuth } from '../../context/AuthContext';

const emptyMember = () => ({ fullName: '', age: '', gender: '', relationship: '' });

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

export default function DriverGuestBookingForm({ item }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unavailable, setUnavailable] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  const tripDestinations = useMemo(() => {
    const spots = t('driverGuestBooking.tripDestinations', { returnObjects: true });
    return Array.isArray(spots) ? spots : [];
  }, [t, i18n.language]);

  const termsSummary = useMemo(() => {
    const lines = t('driverGuestBooking.termsSummary', { returnObjects: true });
    return Array.isArray(lines) ? lines : [];
  }, [t, i18n.language]);

  const fullTermsSections = useMemo(() => {
    const sections = t('driverGuestBooking.fullTermsSections', { returnObjects: true });
    return Array.isArray(sections) ? sections : [];
  }, [t, i18n.language]);

  const [form, setForm] = useState(() => ({
    tripDate: '',
    pickupTime: '09:00',
    taxiType: 'PER_TRIP',
    hours: 4,
    passengerCount: 2,
    leadFullName: user?.name || '',
    leadAge: '',
    leadGender: '',
    leadMobile: user?.phone || '',
    leadEmail: user?.email || '',
    leadAddress: '',
    leadCityState: 'Mahabaleshwar, Maharashtra',
    leadPincode: '',
    emergencyName: '',
    emergencyMobile: '',
    pickupLocation: '',
    dropLocation: '',
    preferredDestinations: [],
    specialRequests: '',
    groupMembers: [emptyMember(), emptyMember()],
    paymentMode: 'ONLINE',
    advanceAmount: '',
    acceptTerms: false,
  }));

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setMember = (index, key, value) => {
    setForm((prev) => {
      const next = [...(prev.groupMembers || [])];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, groupMembers: next };
    });
  };

  const toggleDestination = (value) => {
    setForm((prev) => {
      const selected = prev.preferredDestinations || [];
      const next = selected.includes(value) ? selected.filter((s) => s !== value) : [...selected, value];
      return { ...prev, preferredDestinations: next };
    });
  };

  const tripHours = Number(form.hours || 1);
  const tripPrice =
    form.taxiType === 'HOURLY'
      ? (item?.hourlyRate || 0) * tripHours
      : item?.perTripPrice || 0;
  const subtotal = tripPrice;
  const gst = calcGST(subtotal);
  const total = subtotal + gst;
  const dateBlocked = form.tripDate && unavailable.includes(form.tripDate);

  useEffect(() => {
    if (!item?._id || !form.tripDate) return;
    fetchAvailability('driver', item._id, form.tripDate, form.tripDate)
      .then((d) => setUnavailable(d.unavailable || []))
      .catch(() => setUnavailable([]));
  }, [item?._id, form.tripDate]);

  useEffect(() => {
    const extra = Math.max(0, Number(form.passengerCount || 1) - 1);
    setForm((prev) => {
      const current = prev.groupMembers || [];
      if (current.length === extra) return prev;
      const next = [...current];
      while (next.length < extra) next.push(emptyMember());
      while (next.length > extra) next.pop();
      return { ...prev, groupMembers: next };
    });
  }, [form.passengerCount]);

  const validate = () => {
    if (!form.tripDate) return t('driverGuestBooking.validation.tripDate');
    if (dateBlocked) return t('driverGuestBooking.validation.unavailable');
    if (!String(form.leadFullName || '').trim()) return t('driverGuestBooking.validation.fullName');
    if (!String(form.leadMobile || '').trim()) return t('driverGuestBooking.validation.mobile');
    if (!String(form.pickupLocation || '').trim()) return t('driverGuestBooking.validation.pickup');
    if (!form.acceptTerms) return t('driverGuestBooking.validation.acceptTerms');
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
      const emergencyNote = [form.emergencyName, form.emergencyMobile].filter(Boolean).join(' · ');
      const specialRequests = [form.specialRequests, emergencyNote ? `Emergency: ${emergencyNote}` : '']
        .filter(Boolean)
        .join('\n');

      const res = await createTaxiBooking({
        driverId: item._id,
        taxiType: form.taxiType,
        hours: form.taxiType === 'HOURLY' ? tripHours : undefined,
        checkIn: form.tripDate,
        guestRegistration: {
          formDate: new Date().toISOString(),
          checkInTime: form.pickupTime,
          adults: Number(form.passengerCount) || 1,
          leadGuest: {
            fullName: form.leadFullName,
            age: form.leadAge ? Number(form.leadAge) : undefined,
            gender: form.leadGender || '',
            mobile: form.leadMobile,
            email: form.leadEmail,
            address: form.leadAddress,
            cityState: form.leadCityState,
            pincode: form.leadPincode,
            comingFrom: form.pickupLocation,
            goingTo: form.dropLocation,
            purpose: 'TOURISM',
          },
          coTravellers: (form.groupMembers || []).filter((m) => String(m.fullName || '').trim()),
          advanceAmount: form.advanceAmount !== '' ? Number(form.advanceAmount) : total,
          paymentMode: form.paymentMode || 'ONLINE',
          acceptTerms: true,
          acceptedTermsAt: new Date().toISOString(),
          taxiDetails: {
            tripType: form.taxiType,
            hours: form.taxiType === 'HOURLY' ? tripHours : undefined,
            startTime: form.pickupTime,
            passengerCount: Number(form.passengerCount) || 1,
            pickupLocation: form.pickupLocation,
            dropLocation: form.dropLocation,
            preferredDestinations: form.preferredDestinations || [],
            specialRequests,
            tripPrice,
            hourlyRate: item?.hourlyRate || 0,
            perTripPrice: item?.perTripPrice || 0,
          },
        },
      });
      const booking = res.data.data;
      toast.success(t('driverGuestBooking.bookingCreated'));
      try {
        await payForBooking(booking, user);
        toast.success(t('driverGuestBooking.paymentSuccess'));
      } catch {
        toast(t('driverGuestBooking.bookingSavedPayLater'));
      }
      navigate('/dashboard/customer/bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || t('driverGuestBooking.bookingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t('driverGuestBooking.formTitle')}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {t('driverGuestBooking.formSubtitle', { name: item?.name })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FormLanguageToggle />
            <p className="text-sm text-slate-500">
              {t('driverGuestBooking.formDate')}: {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <Card className="space-y-4">
          <SectionTitle>{t('driverGuestBooking.section1')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label={t('driverGuestBooking.tripDate')}
              type="date"
              value={form.tripDate}
              onChange={(e) => setField('tripDate', e.target.value)}
              required
            />
            <Input
              label={t('driverGuestBooking.pickupTime')}
              type="time"
              value={form.pickupTime}
              onChange={(e) => setField('pickupTime', e.target.value)}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {t('driverGuestBooking.tripTypeLabel')}
              </label>
              <select
                className="input-field"
                value={form.taxiType}
                onChange={(e) => setField('taxiType', e.target.value)}
              >
                <option value="PER_TRIP">
                  {t('driverGuestBooking.perTrip')} — {formatCurrency(item?.perTripPrice || 0)}
                </option>
                <option value="HOURLY">
                  {t('driverGuestBooking.hourly')} — {formatCurrency(item?.hourlyRate || 0)}/hr
                </option>
              </select>
            </div>
            {form.taxiType === 'HOURLY' && (
              <Input
                label={t('driverGuestBooking.hours')}
                type="number"
                min="1"
                value={form.hours}
                onChange={(e) => setField('hours', e.target.value)}
              />
            )}
            <Input
              label={t('driverGuestBooking.passengerCount')}
              type="number"
              min="1"
              value={form.passengerCount}
              onChange={(e) => setField('passengerCount', e.target.value)}
            />
          </div>
          {dateBlocked && <p className="text-sm text-red-600">{t('driverGuestBooking.validation.unavailable')}</p>}
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('driverGuestBooking.section2')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              className="sm:col-span-2"
              label={t('driverGuestBooking.fullName')}
              value={form.leadFullName}
              onChange={(e) => setField('leadFullName', e.target.value)}
              required
            />
            <Input label={t('driverGuestBooking.age')} type="number" min="1" value={form.leadAge} onChange={(e) => setField('leadAge', e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('driverGuestBooking.gender')}</label>
              <select className="input-field" value={form.leadGender} onChange={(e) => setField('leadGender', e.target.value)}>
                <option value="">{t('driverGuestBooking.selectGender')}</option>
                <option value="M">{t('driverGuestBooking.genderMale')}</option>
                <option value="F">{t('driverGuestBooking.genderFemale')}</option>
                <option value="OTHER">{t('driverGuestBooking.genderOther')}</option>
              </select>
            </div>
            <Input label={t('driverGuestBooking.mobile')} value={form.leadMobile} onChange={(e) => setField('leadMobile', e.target.value)} required />
            <Input label={t('driverGuestBooking.email')} type="email" value={form.leadEmail} onChange={(e) => setField('leadEmail', e.target.value)} />
            <Input
              className="sm:col-span-2"
              label={t('driverGuestBooking.address')}
              value={form.leadAddress}
              onChange={(e) => setField('leadAddress', e.target.value)}
            />
            <Input label={t('driverGuestBooking.cityState')} value={form.leadCityState} onChange={(e) => setField('leadCityState', e.target.value)} />
            <Input label={t('driverGuestBooking.pinCode')} value={form.leadPincode} onChange={(e) => setField('leadPincode', e.target.value)} />
            <Input label={t('driverGuestBooking.emergencyName')} value={form.emergencyName} onChange={(e) => setField('emergencyName', e.target.value)} />
            <Input label={t('driverGuestBooking.emergencyMobile')} value={form.emergencyMobile} onChange={(e) => setField('emergencyMobile', e.target.value)} />
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('driverGuestBooking.section3')}</SectionTitle>
          <Input
            label={t('driverGuestBooking.pickupLocation')}
            value={form.pickupLocation}
            onChange={(e) => setField('pickupLocation', e.target.value)}
            required
          />
          <Input
            label={t('driverGuestBooking.dropLocation')}
            value={form.dropLocation}
            onChange={(e) => setField('dropLocation', e.target.value)}
          />
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t('driverGuestBooking.preferredDestinations')}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {tripDestinations.map((spot) => (
                <label key={spot.value} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={(form.preferredDestinations || []).includes(spot.value)}
                    onChange={() => toggleDestination(spot.value)}
                  />
                  {spot.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('driverGuestBooking.specialRequests')}</label>
            <textarea
              className="input-field min-h-[88px]"
              value={form.specialRequests}
              onChange={(e) => setField('specialRequests', e.target.value)}
            />
          </div>
        </Card>

        {(form.groupMembers || []).length > 0 && (
          <Card className="space-y-4">
            <SectionTitle>{t('driverGuestBooking.section4')}</SectionTitle>
            <div className="space-y-3">
              {(form.groupMembers || []).map((member, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-4">
                  <Input
                    className="sm:col-span-2"
                    label={t('driverGuestBooking.guestFullName', { n: index + 2 })}
                    value={member.fullName}
                    onChange={(e) => setMember(index, 'fullName', e.target.value)}
                  />
                  <Input label={t('driverGuestBooking.age')} type="number" min="0" value={member.age} onChange={(e) => setMember(index, 'age', e.target.value)} />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('driverGuestBooking.gender')}</label>
                    <select className="input-field" value={member.gender} onChange={(e) => setMember(index, 'gender', e.target.value)}>
                      <option value="">{t('driverGuestBooking.selectGender')}</option>
                      <option value="M">{t('driverGuestBooking.genderMale')}</option>
                      <option value="F">{t('driverGuestBooking.genderFemale')}</option>
                      <option value="OTHER">{t('driverGuestBooking.genderOther')}</option>
                    </select>
                  </div>
                  <Input
                    className="sm:col-span-2"
                    label={t('driverGuestBooking.relationship')}
                    value={member.relationship}
                    onChange={(e) => setMember(index, 'relationship', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="space-y-4">
          <SectionTitle>{t('driverGuestBooking.section5')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">{t('driverGuestBooking.fareSummary')}</p>
              <p className="font-semibold text-slate-900">{formatCurrency(tripPrice)}</p>
            </div>
            {form.taxiType === 'HOURLY' && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">{t('driverGuestBooking.hoursSummary')}</p>
                <p className="font-semibold text-slate-900">{tripHours}</p>
              </div>
            )}
            <Input
              label={t('driverGuestBooking.advanceAmount')}
              type="number"
              min="0"
              value={form.advanceAmount}
              onChange={(e) => setField('advanceAmount', e.target.value)}
              placeholder={String(total || '')}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t('driverGuestBooking.paymentMode')}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              {[
                ['CASH', 'payCash'],
                ['ONLINE', 'payOnline'],
                ['CARD', 'payCard'],
              ].map(([value, labelKey]) => (
                <label key={value} className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={form.paymentMode === value}
                    onChange={() => setField('paymentMode', value)}
                  />
                  {t(`driverGuestBooking.${labelKey}`)}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{t('driverGuestBooking.paymentHint')}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>{t('driverGuestBooking.subtotalLabel')}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>{t('driverGuestBooking.gstLabel')}</span>
              <span>{formatCurrency(gst)}</span>
            </div>
            <div className="mt-2 flex justify-between font-bold text-primary">
              <span>{t('driverGuestBooking.totalLabel')}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('driverGuestBooking.section6')}</SectionTitle>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            {termsSummary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button type="button" className="text-sm font-semibold text-primary underline" onClick={() => setLegalOpen(true)}>
            {t('driverGuestBooking.readFullTerms')}
          </button>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.acceptTerms}
              onChange={(e) => setField('acceptTerms', e.target.checked)}
            />
            <span>{t('driverGuestBooking.acceptTerms')}</span>
          </label>
        </Card>

        <Button type="submit" className="w-full sm:w-auto" disabled={dateBlocked || submitting}>
          {submitting ? t('common.loading') : t('driverGuestBooking.confirmBooking')}
        </Button>
      </form>

      <LegalModal
        open={legalOpen}
        title={t('driverGuestBooking.fullTermsTitle')}
        sections={fullTermsSections}
        closeLabel={t('driverGuestBooking.close')}
        onClose={() => setLegalOpen(false)}
      />
    </>
  );
}
