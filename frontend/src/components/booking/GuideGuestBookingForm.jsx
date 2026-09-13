import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Input from '../ui/Input';
import PincodeInput from '../ui/PincodeInput';
import TimePicker12h from '../ui/TimePicker12h';
import Card from '../ui/Card';
import FormLanguageToggle from '../common/FormLanguageToggle';
import ServiceRateChartToggle from './ServiceRateChartToggle';
import { calcGST, formatCurrency } from '../../utils/format';
import { createGuideBooking } from '../../services/bookingsApi';
import { fetchAvailability } from '../../services/listingsApi';
import { payForBooking } from '../../services/paymentsApi';
import { useAuth } from '../../context/AuthContext';
import {
  DEFAULT_GUIDE_PACKAGE_ID,
  GUIDE_BIKE_ADDON,
  GUIDE_OVERTIME_PER_HOUR,
  GUIDE_PACKAGES,
  GUIDE_TOUR_BREAKDOWN,
  GUIDE_TOUR_LOCATIONS,
  guideOpenPrice,
} from '../../constants/guideClientRateChart';

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-slate-900">{children}</h3>;
}

function SpotList({ spots }) {
  const list = Array.isArray(spots) ? spots : [];
  if (!list.length) return null;
  return (
    <ul className="space-y-1.5">
      {list.map((spot) => (
        <li key={spot} className="flex gap-2 text-xs leading-snug text-slate-700 sm:text-sm">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-sm bg-primary" aria-hidden />
          <span>{spot}</span>
        </li>
      ))}
    </ul>
  );
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

function BikeAddonConfirmModal({ open, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" onClick={onCancel} role="presentation">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={message}
      >
        <h2 className="whitespace-pre-line text-lg font-bold text-slate-900">{message}</h2>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function GuideGuestBookingForm({ item, openMode = false }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unavailable, setUnavailable] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [bikeConfirmChoice, setBikeConfirmChoice] = useState(null);

  const termsSummary = useMemo(() => {
    const lines = t('guideGuestBooking.termsSummary', { returnObjects: true });
    return Array.isArray(lines) ? lines : [];
  }, [t, i18n.language]);

  const fullTermsSections = useMemo(() => {
    const sections = t('guideGuestBooking.fullTermsSections', { returnObjects: true });
    return Array.isArray(sections) ? sections : [];
  }, [t, i18n.language]);

  const [form, setForm] = useState(() => ({
    tourDate: '',
    startTime: '09:00',
    guidePackage: openMode ? DEFAULT_GUIDE_PACKAGE_ID : '6HR',
    selectedTourId: GUIDE_TOUR_LOCATIONS[0]?.id || '',
    bikeAddon: '',
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
    preferredSpots: [],
    specialRequests: '',
    groupMembers: [],
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

  const wantsBike = form.bikeAddon === 'yes';
  const packagePrice = openMode
    ? guideOpenPrice(form.guidePackage, wantsBike)
    : form.guidePackage === '12HR' || form.guidePackage === '8HR'
      ? item?.package12hr || 1500
      : item?.package6hr || 900;
  const bikePrice = wantsBike
    ? openMode
      ? GUIDE_BIKE_ADDON
      : item?.bikeAddonPrice || 200
    : 0;
  const subtotal = openMode ? packagePrice : packagePrice + bikePrice;
  // GST temporarily disabled
  // const gst = calcGST(subtotal);
  // const total = subtotal + gst;
  const gst = 0;
  const total = subtotal;
  const dateBlocked = form.tourDate && unavailable.includes(form.tourDate);

  const selectedTourBreakdown = useMemo(
    () => GUIDE_TOUR_BREAKDOWN.find((tour) => tour.id === form.selectedTourId) || GUIDE_TOUR_BREAKDOWN[0],
    [form.selectedTourId]
  );

  const selectedTourSpots = useMemo(() => {
    if (!openMode || !selectedTourBreakdown) return [];
    const isEightHour = form.guidePackage === '8HR' || form.guidePackage === '12HR';
    const spots = t(
      isEightHour ? selectedTourBreakdown.eightHourSpotsKey : selectedTourBreakdown.fourHourSpotsKey,
      { returnObjects: true }
    );
    return Array.isArray(spots) ? spots : [];
  }, [openMode, selectedTourBreakdown, form.guidePackage, t, i18n.language]);

  const selectedPackageLabel = useMemo(() => {
    if (!openMode) return '';
    if (form.guidePackage === '8HR' || form.guidePackage === '12HR') {
      return t('guideGuestBooking.packages.eightHour.name');
    }
    if (selectedTourBreakdown?.halfDayLabelKey) return t(selectedTourBreakdown.halfDayLabelKey);
    return t('guideGuestBooking.packages.fourHour.name');
  }, [openMode, form.guidePackage, selectedTourBreakdown, t, i18n.language]);

  useEffect(() => {
    if (openMode || !item?._id || !form.tourDate) return;
    fetchAvailability('guide', item._id, form.tourDate, form.tourDate)
      .then((d) => setUnavailable(d.unavailable || []))
      .catch(() => setUnavailable([]));
  }, [item?._id, form.tourDate]);

  const validate = () => {
    if (!form.tourDate) return t('guideGuestBooking.validation.tourDate');
    if (dateBlocked) return t('guideGuestBooking.validation.unavailable');
    if (form.bikeAddon !== 'yes' && form.bikeAddon !== 'no') {
      return t('guideGuestBooking.validation.bikeAddon');
    }
    if (!String(form.leadFullName || '').trim()) return t('guideGuestBooking.validation.fullName');
    if (!String(form.leadMobile || '').trim()) return t('guideGuestBooking.validation.mobile');
    if (!form.acceptTerms) return t('guideGuestBooking.validation.acceptTerms');
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

      const res = await createGuideBooking({
        open: openMode,
        guideId: openMode ? undefined : item._id,
        guidePackage: form.guidePackage,
        bikeAddon: wantsBike,
        checkIn: form.tourDate,
        guestRegistration: {
          formDate: new Date().toISOString(),
          checkInTime: form.startTime,
          adults: Math.max(1, 1 + (form.groupMembers || []).filter((m) => String(m.fullName || '').trim()).length),
          leadGuest: {
            fullName: form.leadFullName,
            age: form.leadAge ? Number(form.leadAge) : undefined,
            gender: form.leadGender || '',
            mobile: form.leadMobile,
            email: form.leadEmail,
            address: form.leadAddress,
            cityState: form.leadCityState,
            pincode: form.leadPincode,
            comingFrom: form.emergencyName || '',
            goingTo: form.emergencyMobile || '',
            purpose: 'TOURISM',
          },
          coTravellers: (form.groupMembers || []).filter((m) => String(m.fullName || '').trim()),
          advanceAmount: form.advanceAmount !== '' ? Number(form.advanceAmount) : total,
          paymentMode: form.paymentMode || 'ONLINE',
          acceptTerms: true,
          acceptedTermsAt: new Date().toISOString(),
          tourDetails: {
            packageType: form.guidePackage,
            tourLocationId: openMode ? form.selectedTourId : undefined,
            bikeAddon: wantsBike,
            startTime: form.startTime,
            touristCount: Math.max(1, 1 + (form.groupMembers || []).filter((m) => String(m.fullName || '').trim()).length),
            pickupLocation: form.pickupLocation,
            preferredSpots: form.preferredSpots || [],
            specialRequests,
            packagePrice,
            bikeAddonPrice: bikePrice,
          },
        },
      });
      const booking = res.data.data;
      toast.success(openMode ? 'Request submitted — we will assign a guide and confirm shortly.' : 'Booking created — proceed to pay');
      if (!openMode) {
        try {
          await payForBooking(booking, user);
          toast.success('Payment successful');
        } catch {
          toast('Booking saved. You can pay from My Bookings.');
        }
      }
      navigate('/dashboard/customer/bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className={`flex flex-wrap items-end gap-3 ${openMode ? 'service-booking-form-toolbar' : 'justify-between'}`}>
          {!openMode && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t('guideGuestBooking.formTitle')}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('guideGuestBooking.formSubtitle', { name: item?.name })}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <FormLanguageToggle />
            <p className="form-date text-sm text-slate-500">
              {t('guideGuestBooking.formDate')}: {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <Card className="space-y-4">
          <SectionTitle>{t('guideGuestBooking.section1')}</SectionTitle>
          {openMode && (
            <ServiceRateChartToggle
              seeLabel={t('serviceBooking.seeRateChart')}
              hideLabel={t('serviceBooking.hideRateChart')}
            >
              <div className="space-y-5">
                <div>
                  <p className="font-semibold text-slate-900">{t('guideGuestBooking.rateChartTitle')}</p>
                  <p className="mt-1 text-xs text-slate-600">{t('guideGuestBooking.rateChartNote')}</p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-600">
                          <th className="py-2 pr-3 font-medium">{t('guideGuestBooking.chartPackage')}</th>
                          <th className="py-2 pr-3 font-medium">{t('guideGuestBooking.chartDuration')}</th>
                          <th className="py-2 pr-3 font-medium">{t('guideGuestBooking.chartGuideOnly')}</th>
                          <th className="py-2 font-medium">{t('guideGuestBooking.chartGuideBike')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {GUIDE_PACKAGES.map((pkg) => (
                          <tr key={pkg.id} className="border-b border-slate-100">
                            <td className="py-2 pr-3">{t(pkg.nameKey)}</td>
                            <td className="py-2 pr-3">{t(pkg.durationKey)}</td>
                            <td className="py-2 pr-3 font-semibold">{formatCurrency(pkg.guideOnly)}</td>
                            <td className="py-2 font-semibold">{formatCurrency(pkg.withBike)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-900">{t('guideGuestBooking.sightseeingTitle')}</p>
                  <p className="mt-1 text-xs text-slate-600">{t('guideGuestBooking.sightseeingNote')}</p>
                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-[720px] w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-primary text-white">
                          <th className="px-3 py-3 font-semibold">{t('guideGuestBooking.chartTourType')}</th>
                          <th className="px-3 py-3 font-semibold">{t('guideGuestBooking.chartFourHour')}</th>
                          <th className="px-3 py-3 font-semibold">{t('guideGuestBooking.chartEightHour')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {GUIDE_TOUR_BREAKDOWN.map((tour) => {
                          const fourSpots = t(tour.fourHourSpotsKey, { returnObjects: true });
                          const eightSpots = t(tour.eightHourSpotsKey, { returnObjects: true });
                          return (
                            <tr key={tour.id} className="border-t border-slate-200 align-top odd:bg-white even:bg-slate-50">
                              <td className="px-3 py-3 font-semibold text-slate-900">
                                {t(tour.nameKey)}
                              </td>
                              <td className="px-3 py-3">
                                {tour.halfDayLabelKey ? (
                                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
                                    {t(tour.halfDayLabelKey)}
                                  </p>
                                ) : null}
                                <SpotList spots={fourSpots} />
                                {tour.noteKey ? (
                                  <p className="mt-2 text-[11px] italic text-slate-500">{t(tour.noteKey)}</p>
                                ) : null}
                              </td>
                              <td className="px-3 py-3">
                                <SpotList spots={eightSpots} />
                                {tour.noteKey ? (
                                  <p className="mt-2 text-[11px] italic text-slate-500">{t(tour.noteKey)}</p>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600">{t('guideGuestBooking.openRateHint')}</p>
              <p className="text-xs font-medium text-slate-700">
                {t('guideGuestBooking.overtimeNote', { rate: formatCurrency(GUIDE_OVERTIME_PER_HOUR) })}
              </p>
            </ServiceRateChartToggle>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.35fr)] lg:items-end">
            <Input
              label={t('guideGuestBooking.tourDate')}
              type="date"
              value={form.tourDate}
              onChange={(e) => setField('tourDate', e.target.value)}
              required
            />
            <TimePicker12h
              label={t('guideGuestBooking.startTime')}
              name="startTime"
              value={form.startTime}
              onChange={(v) => setField('startTime', v)}
            />
            <div className="min-w-0 sm:col-span-2 lg:col-span-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {t('guideGuestBooking.packageLabel')}
              </label>
              <select
                className="input-field"
                value={form.guidePackage}
                onChange={(e) => setField('guidePackage', e.target.value)}
              >
                {openMode
                  ? GUIDE_PACKAGES.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {t(pkg.nameKey)} — {formatCurrency(wantsBike ? pkg.withBike : pkg.guideOnly)}
                      </option>
                    ))
                  : (
                    <>
                      <option value="6HR">
                        {t('guideGuestBooking.package6hr')} — {formatCurrency(item?.package6hr || 0)}
                      </option>
                      <option value="12HR">
                        {t('guideGuestBooking.package12hr')} — {formatCurrency(item?.package12hr || 0)}
                      </option>
                    </>
                  )}
              </select>
            </div>
            {openMode && (
              <div className="sm:col-span-2 lg:col-span-3 space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t('guideGuestBooking.tourLocationLabel')}
                  </label>
                  <select
                    className="input-field"
                    value={form.selectedTourId}
                    onChange={(e) => setField('selectedTourId', e.target.value)}
                  >
                    {GUIDE_TOUR_LOCATIONS.map((tour) => (
                      <option key={tour.id} value={tour.id}>
                        {t(tour.nameKey)}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedTourSpots.length > 0 && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {t('guideGuestBooking.pointsCoveredTitle', {
                        tour: t(selectedTourBreakdown.nameKey),
                        package: selectedPackageLabel,
                      })}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{t('guideGuestBooking.pointsCoveredHint')}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {selectedTourSpots.map((spot) => (
                        <div key={spot} className="flex gap-2 text-sm text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-sm bg-primary" aria-hidden />
                          <span>{spot}</span>
                        </div>
                      ))}
                    </div>
                    {selectedTourBreakdown?.noteKey ? (
                      <p className="mt-3 text-xs italic text-slate-500">{t(selectedTourBreakdown.noteKey)}</p>
                    ) : null}
                  </div>
                )}
              </div>
            )}
            <div>
              <p className="mb-1.5 block text-sm font-medium text-slate-700">
                {t('guideGuestBooking.bikeAddonLabel', {
                  price: formatCurrency(openMode ? GUIDE_BIKE_ADDON : item?.bikeAddonPrice || 0),
                })}
                <span className="text-red-500"> *</span>
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="guideBikeAddon"
                    value="yes"
                    checked={form.bikeAddon === 'yes'}
                    onChange={() => setBikeConfirmChoice('yes')}
                    required
                  />
                  {t('guideGuestBooking.bikeAddonYes')}
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="guideBikeAddon"
                    value="no"
                    checked={form.bikeAddon === 'no'}
                    onChange={() => setBikeConfirmChoice('no')}
                    required
                  />
                  {t('guideGuestBooking.bikeAddonNo')}
                </label>
              </div>
            </div>
          </div>
          <p className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2.5 text-sm text-slate-700">
            {t('guideGuestBooking.overtimeNote', { rate: formatCurrency(GUIDE_OVERTIME_PER_HOUR) })}
          </p>
          {dateBlocked && <p className="text-sm text-red-600">{t('guideGuestBooking.validation.unavailable')}</p>}
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('guideGuestBooking.section2')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              className="sm:col-span-2"
              label={t('guideGuestBooking.fullName')}
              value={form.leadFullName}
              onChange={(e) => setField('leadFullName', e.target.value)}
              required
            />
            <Input label={t('guideGuestBooking.mobile')} value={form.leadMobile} onChange={(e) => setField('leadMobile', e.target.value)} required />
            <Input label={t('guideGuestBooking.email')} type="email" value={form.leadEmail} onChange={(e) => setField('leadEmail', e.target.value)} />
            <Input
              className="sm:col-span-2"
              label={t('guideGuestBooking.hotelOrPickupAddress')}
              value={form.leadAddress}
              onChange={(e) => setField('leadAddress', e.target.value)}
            />
            <Input label={t('guideGuestBooking.cityState')} value={form.leadCityState} onChange={(e) => setField('leadCityState', e.target.value)} />
            <PincodeInput label={t('guideGuestBooking.pinCode')} value={form.leadPincode} onChange={(e) => setField('leadPincode', e.target.value)} />
            <Input label={t('guideGuestBooking.emergencyName')} value={form.emergencyName} onChange={(e) => setField('emergencyName', e.target.value)} />
            <Input label={t('guideGuestBooking.emergencyMobile')} value={form.emergencyMobile} onChange={(e) => setField('emergencyMobile', e.target.value)} />
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('guideGuestBooking.section3')}</SectionTitle>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('guideGuestBooking.specialRequests')}</label>
            <textarea
              className="input-field min-h-[88px]"
              value={form.specialRequests}
              onChange={(e) => setField('specialRequests', e.target.value)}
            />
          </div>
        </Card>

        {(form.groupMembers || []).length > 0 && (
          <Card className="space-y-4">
            <SectionTitle>{t('guideGuestBooking.sectionGroupMembers')}</SectionTitle>
            <div className="space-y-3">
              {(form.groupMembers || []).map((member, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-4">
                  <Input
                    className="sm:col-span-2"
                    label={t('guideGuestBooking.guestFullName', { n: index + 2 })}
                    value={member.fullName}
                    onChange={(e) => setMember(index, 'fullName', e.target.value)}
                  />
                  <Input label={t('guideGuestBooking.age')} type="number" min="0" value={member.age} onChange={(e) => setMember(index, 'age', e.target.value)} />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('guideGuestBooking.gender')}</label>
                    <select className="input-field" value={member.gender} onChange={(e) => setMember(index, 'gender', e.target.value)}>
                      <option value="">{t('guideGuestBooking.selectGender')}</option>
                      <option value="M">{t('guideGuestBooking.genderMale')}</option>
                      <option value="F">{t('guideGuestBooking.genderFemale')}</option>
                      <option value="OTHER">{t('guideGuestBooking.genderOther')}</option>
                    </select>
                  </div>
                  <Input
                    className="sm:col-span-2"
                    label={t('guideGuestBooking.relationship')}
                    value={member.relationship}
                    onChange={(e) => setMember(index, 'relationship', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="space-y-4">
          <SectionTitle>{t('guideGuestBooking.section4')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">{t('guideGuestBooking.packageSummary')}</p>
              <p className="font-semibold text-slate-900">{formatCurrency(packagePrice)}</p>
            </div>
            {wantsBike && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">{t('guideGuestBooking.bikeSummary')}</p>
                <p className="font-semibold text-slate-900">{formatCurrency(bikePrice)}</p>
              </div>
            )}
            <Input
              label={t('guideGuestBooking.advanceAmount')}
              type="number"
              min="0"
              value={form.advanceAmount}
              onChange={(e) => setField('advanceAmount', e.target.value)}
              placeholder={String(total || '')}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t('guideGuestBooking.paymentMode')}</p>
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
                  {t(`guideGuestBooking.${labelKey}`)}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{t('guideGuestBooking.paymentHint')}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>{t('guideGuestBooking.subtotalLabel')}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {/* GST temporarily disabled
            <div className="mt-1 flex justify-between">
              <span>{t('guideGuestBooking.gstLabel')}</span>
              <span>{formatCurrency(gst)}</span>
            </div>
            */}
            <div className="mt-2 flex justify-between font-bold text-primary">
              <span>{t('guideGuestBooking.totalLabel')}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('guideGuestBooking.section5')}</SectionTitle>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            {termsSummary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button type="button" className="text-sm font-semibold text-primary underline" onClick={() => setLegalOpen(true)}>
            {t('guideGuestBooking.readFullTerms')}
          </button>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.acceptTerms}
              onChange={(e) => setField('acceptTerms', e.target.checked)}
            />
            <span>{t('guideGuestBooking.acceptTerms')}</span>
          </label>
        </Card>

        <Button type="submit" className="w-full sm:w-auto" disabled={dateBlocked || submitting}>
          {submitting ? t('common.loading') : t('guideGuestBooking.confirmBooking')}
        </Button>
      </form>

      <LegalModal
        open={legalOpen}
        title={t('guideGuestBooking.fullTermsTitle')}
        sections={fullTermsSections}
        closeLabel={t('guideGuestBooking.close')}
        onClose={() => setLegalOpen(false)}
      />
      <BikeAddonConfirmModal
        open={bikeConfirmChoice === 'yes' || bikeConfirmChoice === 'no'}
        message={
          bikeConfirmChoice === 'yes'
            ? t('guideGuestBooking.bikeAddonAskYes', {
                price: formatCurrency(openMode ? GUIDE_BIKE_ADDON : item?.bikeAddonPrice || 0),
              })
            : t('guideGuestBooking.bikeAddonAskNo')
        }
        confirmLabel={t('guideGuestBooking.bikeAddonConfirm')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setBikeConfirmChoice(null)}
        onConfirm={() => {
          if (bikeConfirmChoice === 'yes' || bikeConfirmChoice === 'no') {
            setField('bikeAddon', bikeConfirmChoice);
          }
          setBikeConfirmChoice(null);
        }}
      />
    </>
  );
}
