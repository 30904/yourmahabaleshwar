import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import FormLanguageToggle from '../common/FormLanguageToggle';
import ServiceRateChartToggle from './ServiceRateChartToggle';
import { calcGST, formatCurrency } from '../../utils/format';
import { createTaxiBooking } from '../../services/bookingsApi';
import { fetchAvailability } from '../../services/listingsApi';
import { payForBooking } from '../../services/paymentsApi';
import { useAuth } from '../../context/AuthContext';
import {
  DEFAULT_TAXI_ROUTE_ID,
  TAXI_LOCAL_TOURS,
  TAXI_OUTSTATION_ROUTES,
  taxiRouteById,
  taxiRoutePrice,
} from '../../constants/taxiClientRateChart';
import { useGroupMemberSync } from '../../hooks/useCoTravellerSync';

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

export default function TaxiGuestBookingForm({ item, openMode = false, serviceTenant = 'TAXI' }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unavailable, setUnavailable] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  const tripDestinations = useMemo(() => {
    const spots = t('taxiGuestBooking.tripDestinations', { returnObjects: true });
    return Array.isArray(spots) ? spots : [];
  }, [t, i18n.language]);

  const termsSummary = useMemo(() => {
    const lines = t('taxiGuestBooking.termsSummary', { returnObjects: true });
    return Array.isArray(lines) ? lines : [];
  }, [t, i18n.language]);

  const fullTermsSections = useMemo(() => {
    const sections = t('taxiGuestBooking.fullTermsSections', { returnObjects: true });
    return Array.isArray(sections) ? sections : [];
  }, [t, i18n.language]);

  const [form, setForm] = useState(() => ({
    tripDate: '',
    pickupTime: '09:00',
    taxiType: 'PER_TRIP',
    selectedRouteId: DEFAULT_TAXI_ROUTE_ID,
    hours: 4,
    passengerCount: 2,
    vehiclePreference: item?.vehicleType || '',
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

  const toggleDestination = (value) => {
    setForm((prev) => {
      const selected = prev.preferredDestinations || [];
      const next = selected.includes(value) ? selected.filter((s) => s !== value) : [...selected, value];
      return { ...prev, preferredDestinations: next };
    });
  };

  const perTripRate = item?.perTripPrice || 0;
  const hourlyRate = item?.hourlyRate || 0;
  const selectedRoute = taxiRouteById(form.selectedRouteId);

  const routeCategory = useMemo(() => {
    return TAXI_LOCAL_TOURS.some((route) => route.id === form.selectedRouteId) ? 'local' : 'outstation';
  }, [form.selectedRouteId]);

  const categoryRoutes = routeCategory === 'local' ? TAXI_LOCAL_TOURS : TAXI_OUTSTATION_ROUTES;

  const onRouteCategoryChange = (category) => {
    const routes = category === 'local' ? TAXI_LOCAL_TOURS : TAXI_OUTSTATION_ROUTES;
    setField('selectedRouteId', routes[0].id);
  };

  const tripHours = Number(form.hours || 1);
  const tripPrice = openMode
    ? taxiRoutePrice(form.selectedRouteId)
    : form.taxiType === 'HOURLY'
      ? hourlyRate * tripHours
      : perTripRate;
  const subtotal = tripPrice;
  const gst = calcGST(subtotal);
  const total = subtotal + gst;
  const dateBlocked = form.tripDate && unavailable.includes(form.tripDate);

  useEffect(() => {
    if (openMode || !item?._id || !form.tripDate) return;
    fetchAvailability('driver', item._id, form.tripDate, form.tripDate)
      .then((d) => setUnavailable(d.unavailable || []))
      .catch(() => setUnavailable([]));
  }, [openMode, item?._id, form.tripDate]);

  useGroupMemberSync(form.passengerCount, setForm, emptyMember);

  const validate = () => {
    if (!form.tripDate) return t('taxiGuestBooking.validation.tripDate');
    if (dateBlocked) return t('taxiGuestBooking.validation.unavailable');
    if (!String(form.leadFullName || '').trim()) return t('taxiGuestBooking.validation.fullName');
    if (!String(form.leadMobile || '').trim()) return t('taxiGuestBooking.validation.mobile');
    if (!String(form.pickupLocation || '').trim()) return t('taxiGuestBooking.validation.pickup');
    if (!openMode && form.taxiType === 'PER_TRIP' && !String(form.dropLocation || '').trim()) {
      return t('taxiGuestBooking.validation.drop');
    }
    if (!form.acceptTerms) return t('taxiGuestBooking.validation.acceptTerms');
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
      const vehicleNote = form.vehiclePreference
        ? `${t('taxiGuestBooking.vehiclePreference')}: ${form.vehiclePreference}`
        : '';
      const specialRequests = [form.specialRequests, vehicleNote, emergencyNote ? `Emergency: ${emergencyNote}` : '']
        .filter(Boolean)
        .join('\n');

      const res = await createTaxiBooking({
        open: openMode,
        serviceTenant,
        driverId: openMode ? undefined : item._id,
        taxiType: openMode ? 'PER_TRIP' : form.taxiType,
        hours: !openMode && form.taxiType === 'HOURLY' ? tripHours : undefined,
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
            tripType: openMode ? 'ROUTE' : form.taxiType,
            routeId: openMode ? form.selectedRouteId : undefined,
            routeName: openMode ? t(selectedRoute.nameKey) : undefined,
            hours: !openMode && form.taxiType === 'HOURLY' ? tripHours : undefined,
            startTime: form.pickupTime,
            passengerCount: Number(form.passengerCount) || 1,
            pickupLocation: form.pickupLocation,
            dropLocation: form.dropLocation,
            preferredDestinations: form.preferredDestinations || [],
            specialRequests,
            tripPrice,
            hourlyRate: openMode ? 0 : item?.hourlyRate || 0,
            perTripPrice: openMode ? tripPrice : item?.perTripPrice || 0,
          },
        },
      });
      const booking = res.data.data;
      toast.success(openMode ? t('serviceBooking.requestSubmitted') : t('taxiGuestBooking.bookingCreated'));
      if (!openMode) {
        try {
          await payForBooking(booking, user);
          toast.success(t('taxiGuestBooking.paymentSuccess'));
        } catch {
          toast(t('taxiGuestBooking.bookingSavedPayLater'));
        }
      }
      navigate('/dashboard/customer/bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || t('taxiGuestBooking.bookingFailed'));
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
              <h2 className="text-xl font-bold text-slate-900">{t('taxiGuestBooking.formTitle')}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('taxiGuestBooking.formSubtitle', { name: item?.name })}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <FormLanguageToggle />
            <p className="form-date text-sm text-slate-500">
              {t('taxiGuestBooking.formDate')}: {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <Card className="space-y-4">
          <SectionTitle>{t('taxiGuestBooking.section1')}</SectionTitle>
          {openMode && (
            <ServiceRateChartToggle
              seeLabel={t('serviceBooking.seeRateChart')}
              hideLabel={t('serviceBooking.hideRateChart')}
            >
              <div>
                <p className="font-semibold text-slate-900">{t('taxiGuestBooking.localToursTitle')}</p>
                <p className="mt-1 text-xs text-slate-600">{t('taxiGuestBooking.localToursNote')}</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="py-2 pr-3 font-medium">{t('taxiGuestBooking.chartTour')}</th>
                        <th className="py-2 pr-3 font-medium">{t('taxiGuestBooking.chartDuration')}</th>
                        <th className="py-2 font-medium">{t('taxiGuestBooking.chartRate')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TAXI_LOCAL_TOURS.map((route) => (
                        <tr key={route.id} className="border-b border-slate-100">
                          <td className="py-2 pr-3">{t(route.nameKey)}</td>
                          <td className="py-2 pr-3">{t(route.durationKey)}</td>
                          <td className="py-2 font-semibold">{formatCurrency(route.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{t('taxiGuestBooking.outstationTitle')}</p>
                <p className="mt-1 text-xs text-slate-600">{t('taxiGuestBooking.outstationNote')}</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="py-2 pr-3 font-medium">{t('taxiGuestBooking.chartRoute')}</th>
                        <th className="py-2 font-medium">{t('taxiGuestBooking.chartRate')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TAXI_OUTSTATION_ROUTES.map((route) => (
                        <tr key={route.id} className="border-b border-slate-100">
                          <td className="py-2 pr-3">
                            {t(route.nameKey)}
                            {route.tollNote ? ` ${t('taxiGuestBooking.tollExtra')}` : ''}
                          </td>
                          <td className="py-2 font-semibold">{formatCurrency(route.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-slate-600">{t('taxiGuestBooking.openRateHint')}</p>
            </ServiceRateChartToggle>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label={t('taxiGuestBooking.tripDate')}
              type="date"
              value={form.tripDate}
              onChange={(e) => setField('tripDate', e.target.value)}
              required
            />
            <Input
              label={t('taxiGuestBooking.pickupTime')}
              type="time"
              value={form.pickupTime}
              onChange={(e) => setField('pickupTime', e.target.value)}
            />
            {openMode ? (
              <div className="sm:col-span-2 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t('taxiGuestBooking.routeCategoryLabel')}
                  </label>
                  <select
                    className="input-field"
                    value={routeCategory}
                    onChange={(e) => onRouteCategoryChange(e.target.value)}
                  >
                    <option value="local">{t('taxiGuestBooking.localToursTitle')}</option>
                    <option value="outstation">{t('taxiGuestBooking.outstationTitle')}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t('taxiGuestBooking.selectedRouteLabel')}
                  </label>
                  <select
                    className="input-field"
                    value={form.selectedRouteId}
                    onChange={(e) => setField('selectedRouteId', e.target.value)}
                  >
                    {categoryRoutes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {t(route.nameKey)}
                        {route.tollNote ? ` ${t('taxiGuestBooking.tollExtra')}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-slate-600">
                    {t('taxiGuestBooking.selectedFareLabel')}:{' '}
                    <span className="font-semibold text-slate-900">{formatCurrency(tripPrice)}</span>
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t('taxiGuestBooking.tripTypeLabel')}
                  </label>
                  <select
                    className="input-field"
                    value={form.taxiType}
                    onChange={(e) => setField('taxiType', e.target.value)}
                  >
                    <option value="PER_TRIP">
                      {t('taxiGuestBooking.perTrip')} — {formatCurrency(perTripRate)}
                    </option>
                    <option value="HOURLY">
                      {t('taxiGuestBooking.hourly')} — {formatCurrency(hourlyRate)}/hr
                    </option>
                  </select>
                </div>
                {form.taxiType === 'HOURLY' && (
                  <Input
                    label={t('taxiGuestBooking.hours')}
                    type="number"
                    min="1"
                    value={form.hours}
                    onChange={(e) => setField('hours', e.target.value)}
                  />
                )}
              </>
            )}
            <Input
              label={t('taxiGuestBooking.passengerCount')}
              type="number"
              min="1"
              value={form.passengerCount}
              onChange={(e) => setField('passengerCount', e.target.value)}
            />
            <Input
              label={t('taxiGuestBooking.vehiclePreference')}
              value={form.vehiclePreference}
              onChange={(e) => setField('vehiclePreference', e.target.value)}
              placeholder={item?.vehicleType || 'SEDAN, SUV, INNOVA'}
            />
          </div>
          {dateBlocked && <p className="text-sm text-red-600">{t('taxiGuestBooking.validation.unavailable')}</p>}
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('taxiGuestBooking.section2')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              className="sm:col-span-2"
              label={t('taxiGuestBooking.fullName')}
              value={form.leadFullName}
              onChange={(e) => setField('leadFullName', e.target.value)}
              required
            />
            <Input label={t('taxiGuestBooking.age')} type="number" min="1" value={form.leadAge} onChange={(e) => setField('leadAge', e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('taxiGuestBooking.gender')}</label>
              <select className="input-field" value={form.leadGender} onChange={(e) => setField('leadGender', e.target.value)}>
                <option value="">{t('taxiGuestBooking.selectGender')}</option>
                <option value="M">{t('taxiGuestBooking.genderMale')}</option>
                <option value="F">{t('taxiGuestBooking.genderFemale')}</option>
                <option value="OTHER">{t('taxiGuestBooking.genderOther')}</option>
              </select>
            </div>
            <Input label={t('taxiGuestBooking.mobile')} value={form.leadMobile} onChange={(e) => setField('leadMobile', e.target.value)} required />
            <Input label={t('taxiGuestBooking.email')} type="email" value={form.leadEmail} onChange={(e) => setField('leadEmail', e.target.value)} />
            <Input
              className="sm:col-span-2"
              label={t('taxiGuestBooking.address')}
              value={form.leadAddress}
              onChange={(e) => setField('leadAddress', e.target.value)}
            />
            <Input label={t('taxiGuestBooking.cityState')} value={form.leadCityState} onChange={(e) => setField('leadCityState', e.target.value)} />
            <Input label={t('taxiGuestBooking.pinCode')} value={form.leadPincode} onChange={(e) => setField('leadPincode', e.target.value)} />
            <Input label={t('taxiGuestBooking.emergencyName')} value={form.emergencyName} onChange={(e) => setField('emergencyName', e.target.value)} />
            <Input label={t('taxiGuestBooking.emergencyMobile')} value={form.emergencyMobile} onChange={(e) => setField('emergencyMobile', e.target.value)} />
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('taxiGuestBooking.section3')}</SectionTitle>
          <Input
            label={t('taxiGuestBooking.pickupLocation')}
            value={form.pickupLocation}
            onChange={(e) => setField('pickupLocation', e.target.value)}
            required
          />
          <Input
            label={t('taxiGuestBooking.dropLocation')}
            value={form.dropLocation}
            onChange={(e) => setField('dropLocation', e.target.value)}
            required={form.taxiType === 'PER_TRIP'}
          />
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t('taxiGuestBooking.preferredDestinations')}</p>
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
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('taxiGuestBooking.specialRequests')}</label>
            <textarea
              className="input-field min-h-[88px]"
              value={form.specialRequests}
              onChange={(e) => setField('specialRequests', e.target.value)}
            />
          </div>
        </Card>

        {(form.groupMembers || []).length > 0 && (
          <Card className="space-y-4">
            <SectionTitle>{t('taxiGuestBooking.section4')}</SectionTitle>
            <div className="space-y-3">
              {(form.groupMembers || []).map((member, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-4">
                  <Input
                    className="sm:col-span-2"
                    label={t('taxiGuestBooking.guestFullName', { n: index + 2 })}
                    value={member.fullName}
                    onChange={(e) => setMember(index, 'fullName', e.target.value)}
                  />
                  <Input label={t('taxiGuestBooking.age')} type="number" min="0" value={member.age} onChange={(e) => setMember(index, 'age', e.target.value)} />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('taxiGuestBooking.gender')}</label>
                    <select className="input-field" value={member.gender} onChange={(e) => setMember(index, 'gender', e.target.value)}>
                      <option value="">{t('taxiGuestBooking.selectGender')}</option>
                      <option value="M">{t('taxiGuestBooking.genderMale')}</option>
                      <option value="F">{t('taxiGuestBooking.genderFemale')}</option>
                      <option value="OTHER">{t('taxiGuestBooking.genderOther')}</option>
                    </select>
                  </div>
                  <Input
                    className="sm:col-span-2"
                    label={t('taxiGuestBooking.relationship')}
                    value={member.relationship}
                    onChange={(e) => setMember(index, 'relationship', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="space-y-4">
          <SectionTitle>{t('taxiGuestBooking.section5')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">{t('taxiGuestBooking.fareSummary')}</p>
              <p className="font-semibold text-slate-900">{formatCurrency(tripPrice)}</p>
              {openMode && (
                <p className="mt-1 text-xs text-slate-600">{t(selectedRoute.nameKey)}</p>
              )}
            </div>
            {!openMode && form.taxiType === 'HOURLY' && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">{t('taxiGuestBooking.hoursSummary')}</p>
                <p className="font-semibold text-slate-900">{tripHours}</p>
              </div>
            )}
            <Input
              label={t('taxiGuestBooking.advanceAmount')}
              type="number"
              min="0"
              value={form.advanceAmount}
              onChange={(e) => setField('advanceAmount', e.target.value)}
              placeholder={String(total || '')}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t('taxiGuestBooking.paymentMode')}</p>
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
                  {t(`taxiGuestBooking.${labelKey}`)}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{t('taxiGuestBooking.paymentHint')}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>{t('taxiGuestBooking.subtotalLabel')}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>{t('taxiGuestBooking.gstLabel')}</span>
              <span>{formatCurrency(gst)}</span>
            </div>
            <div className="mt-2 flex justify-between font-bold text-primary">
              <span>{t('taxiGuestBooking.totalLabel')}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('taxiGuestBooking.section6')}</SectionTitle>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            {termsSummary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button type="button" className="text-sm font-semibold text-primary underline" onClick={() => setLegalOpen(true)}>
            {t('taxiGuestBooking.readFullTerms')}
          </button>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.acceptTerms}
              onChange={(e) => setField('acceptTerms', e.target.checked)}
            />
            <span>{t('taxiGuestBooking.acceptTerms')}</span>
          </label>
        </Card>

        <Button type="submit" className="w-full sm:w-auto" disabled={dateBlocked || submitting}>
          {submitting ? t('common.loading') : t('taxiGuestBooking.confirmBooking')}
        </Button>
      </form>

      <LegalModal
        open={legalOpen}
        title={t('taxiGuestBooking.fullTermsTitle')}
        sections={fullTermsSections}
        closeLabel={t('taxiGuestBooking.close')}
        onClose={() => setLegalOpen(false)}
      />
    </>
  );
}
