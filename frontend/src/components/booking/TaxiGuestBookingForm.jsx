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
import { createTaxiBooking } from '../../services/bookingsApi';
import { fetchAvailability } from '../../services/listingsApi';
import { payForBooking } from '../../services/paymentsApi';
import ConfigurableFormSections, { useConfigurableForm } from '../forms/ConfigurableFormSections';
import { useAuth } from '../../context/AuthContext';
import {
  DEFAULT_TAXI_ROUTE_ID,
  DEFAULT_TAXI_CAR_TYPE,
  TAXI_CAR_TYPES,
  TAXI_LOCAL_TOURS,
  TAXI_OUTSTATION_ROUTES,
  TAXI_OUTSTATION_CHART_ROWS,
  taxiCarTypeById,
  taxiRouteById,
  taxiRoutePrice,
} from '../../constants/taxiClientRateChart';

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-slate-900">{children}</h3>;
}

function SpotList({ spots }) {
  const list = Array.isArray(spots) ? spots : [];
  if (!list.length) return null;
  return (
    <ul className="space-y-1">
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

export default function TaxiGuestBookingForm({ item, openMode = false, serviceTenant = 'TAXI' }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unavailable, setUnavailable] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const {
    sections: customSections,
    values: customValues,
    setField: setCustomField,
    validate: validateCustom,
    customPayload,
  } = useConfigurableForm('customer', serviceTenant === 'DRIVER' ? 'DRIVER' : 'TAXI');

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
    carType: DEFAULT_TAXI_CAR_TYPE,
    hours: 4,
    passengerCount: 2,
    vehiclePreference: item?.vehicleType || '',
    leadFullName: user?.name || '',
    leadMobile: user?.phone || '',
    leadEmail: user?.email || '',
    leadAddress: '',
    leadCityState: 'Mahabaleshwar, Maharashtra',
    leadPincode: '',
    emergencyName: '',
    emergencyMobile: '',
    pickupLocation: '',
    dropLocation: '',
    routeTripType: 'ROUND_TRIP',
    specialRequests: '',
    paymentMode: 'ONLINE',
    advanceAmount: '',
    acceptTerms: false,
  }));

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const perTripRate = item?.perTripPrice || 0;
  const hourlyRate = item?.hourlyRate || 0;
  const selectedRoute = taxiRouteById(form.selectedRouteId);
  const selectedCarType = taxiCarTypeById(form.carType);
  const selectedRoutePoints = useMemo(() => {
    if (!selectedRoute?.pointsKey) return [];
    const points = t(selectedRoute.pointsKey, { returnObjects: true });
    return Array.isArray(points) ? points : [];
  }, [selectedRoute?.pointsKey, t, i18n.language]);

  const tripHours = Number(form.hours || 1);
  const tripPrice = openMode
    ? taxiRoutePrice(form.selectedRouteId)
    : form.taxiType === 'HOURLY'
      ? hourlyRate * tripHours
      : perTripRate;
  const subtotal = tripPrice;
  // GST temporarily disabled
  // const gst = calcGST(subtotal);
  // const total = subtotal + gst;
  const gst = 0;
  const total = subtotal;
  const dateBlocked = form.tripDate && unavailable.includes(form.tripDate);

  useEffect(() => {
    if (openMode || !item?._id || !form.tripDate) return;
    fetchAvailability('driver', item._id, form.tripDate, form.tripDate)
      .then((d) => setUnavailable(d.unavailable || []))
      .catch(() => setUnavailable([]));
  }, [openMode, item?._id, form.tripDate]);

  const needsDropLocation = form.routeTripType === 'ONE_WAY' || form.routeTripType === 'DROP';

  const validate = () => {
    if (!form.tripDate) return t('taxiGuestBooking.validation.tripDate');
    if (dateBlocked) return t('taxiGuestBooking.validation.unavailable');
    if (!String(form.leadFullName || '').trim()) return t('taxiGuestBooking.validation.fullName');
    if (!String(form.leadMobile || '').trim()) return t('taxiGuestBooking.validation.mobile');
    if (!String(form.leadEmail || '').trim()) return t('taxiGuestBooking.validation.email');
    if (!String(form.pickupLocation || '').trim()) return t('taxiGuestBooking.validation.pickup');
    if (needsDropLocation && !String(form.dropLocation || '').trim()) {
      return t('taxiGuestBooking.validation.drop');
    }
    if (!form.acceptTerms) return t('taxiGuestBooking.validation.acceptTerms');
    const customErr = validateCustom();
    if (customErr) return customErr;
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
      const carTypeLabel = t(selectedCarType.labelKey);
      const vehicleNote = openMode
        ? `${t('taxiGuestBooking.carTypeLabel')}: ${carTypeLabel}`
        : form.vehiclePreference
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
            mobile: form.leadMobile,
            email: form.leadEmail,
            address: form.leadAddress,
            cityState: form.leadCityState,
            pincode: form.leadPincode,
            comingFrom: form.pickupLocation,
            goingTo: needsDropLocation ? form.dropLocation : '',
            purpose: 'TOURISM',
          },
          coTravellers: [],
          advanceAmount: form.advanceAmount !== '' ? Number(form.advanceAmount) : total,
          paymentMode: form.paymentMode || 'ONLINE',
          acceptTerms: true,
          acceptedTermsAt: new Date().toISOString(),
          customFields: customPayload,
          taxiDetails: {
            tripType: openMode ? 'ROUTE' : form.taxiType,
            routeId: openMode ? form.selectedRouteId : undefined,
            routeName: openMode ? t(selectedRoute.nameKey) : undefined,
            carType: openMode ? form.carType : undefined,
            carTypeLabel: openMode ? carTypeLabel : undefined,
            hours: !openMode && form.taxiType === 'HOURLY' ? tripHours : undefined,
            startTime: form.pickupTime,
            passengerCount: Number(form.passengerCount) || 1,
            pickupLocation: form.pickupLocation,
            dropLocation: needsDropLocation ? form.dropLocation : '',
            routeTripType: form.routeTripType,
            preferredDestinations: [],
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
              <div className="space-y-5">
                <div>
                  <p className="font-semibold text-slate-900">{t('taxiGuestBooking.localToursTitle')}</p>
                  <p className="mt-1 text-xs text-slate-600">{t('taxiGuestBooking.localToursNote')}</p>
                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-[820px] w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-primary text-white">
                          <th className="px-3 py-3 font-semibold">{t('taxiGuestBooking.chartTour')}</th>
                          <th className="px-3 py-3 font-semibold">{t('taxiGuestBooking.chartDuration')}</th>
                          <th className="px-3 py-3 font-semibold">{t('taxiGuestBooking.chartKeyPoints')}</th>
                          <th className="px-3 py-3 font-semibold">{t('taxiGuestBooking.chartRate')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TAXI_LOCAL_TOURS.map((route) => {
                          const points = t(route.pointsKey, { returnObjects: true });
                          return (
                            <tr key={route.id} className="border-t border-slate-200 align-top odd:bg-white even:bg-slate-50">
                              <td className="px-3 py-3 font-semibold text-slate-900">{t(route.nameKey)}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-slate-700">{t(route.durationKey)}</td>
                              <td className="px-3 py-3">
                                <SpotList spots={points} />
                                {route.noteKey ? (
                                  <p className="mt-2 text-[11px] italic text-slate-500">{t(route.noteKey)}</p>
                                ) : null}
                              </td>
                              <td className="px-3 py-3 font-semibold text-slate-900">{formatCurrency(route.price)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-900">{t('taxiGuestBooking.outstationTitle')}</p>
                  <p className="mt-1 text-xs text-slate-600">{t('taxiGuestBooking.outstationNote')}</p>
                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-[560px] w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-primary text-white">
                          <th className="px-3 py-3 font-semibold">{t('taxiGuestBooking.chartRoute')}</th>
                          <th className="px-3 py-3 font-semibold">{t('taxiGuestBooking.chartDrop')}</th>
                          <th className="px-3 py-3 font-semibold">{t('taxiGuestBooking.chartReturn')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TAXI_OUTSTATION_CHART_ROWS.map((row) => (
                          <tr key={row.id} className="border-t border-slate-200 odd:bg-white even:bg-slate-50">
                            <td className="px-3 py-3 font-medium text-slate-900">
                              {t(row.nameKey)}
                              {row.tollNote ? ` ${t('taxiGuestBooking.tollExtra')}` : ''}
                            </td>
                            {row.ratesLabelKey ? (
                              <td className="px-3 py-3 font-semibold text-slate-900" colSpan={2}>
                                {t(row.ratesLabelKey)}
                              </td>
                            ) : (
                              <>
                                <td className="px-3 py-3 font-semibold text-slate-900">
                                  {row.drop != null ? formatCurrency(row.drop) : '—'}
                                </td>
                                <td className="px-3 py-3 font-semibold text-slate-900">
                                  {row.return != null ? formatCurrency(row.return) : '—'}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600">{t('taxiGuestBooking.openRateHint')}</p>
            </ServiceRateChartToggle>
          )}
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <Input
                className="w-full max-w-[11.5rem]"
                label={t('taxiGuestBooking.tripDate')}
                type="date"
                value={form.tripDate}
                onChange={(e) => setField('tripDate', e.target.value)}
                required
              />
              <TimePicker12h
                label={t('taxiGuestBooking.pickupTime')}
                name="pickupTime"
                value={form.pickupTime}
                onChange={(v) => setField('pickupTime', v)}
              />
            </div>
            {openMode ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {t('taxiGuestBooking.carTypeLabel')}
                    </label>
                    <select
                      className="input-field"
                      value={form.carType}
                      onChange={(e) => setField('carType', e.target.value)}
                    >
                      {TAXI_CAR_TYPES.map((car) => (
                        <option key={car.id} value={car.id}>
                          {t(car.labelKey)}
                        </option>
                      ))}
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
                      <optgroup label={t('taxiGuestBooking.localToursTitle')}>
                        {TAXI_LOCAL_TOURS.map((route) => (
                          <option key={route.id} value={route.id}>
                            {t(route.nameKey)} — {formatCurrency(route.price)}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label={t('taxiGuestBooking.outstationTitle')}>
                        {TAXI_OUTSTATION_ROUTES.map((route) => (
                          <option key={route.id} value={route.id}>
                            {t(route.nameKey)} — {formatCurrency(route.price)}
                            {route.tollNote ? ` ${t('taxiGuestBooking.tollExtra')}` : ''}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <p className="mt-2 text-sm text-slate-600">
                      {t('taxiGuestBooking.selectedFareLabel')}:{' '}
                      <span className="font-semibold text-slate-900">{formatCurrency(tripPrice)}</span>
                      {selectedRoute?.durationKey ? (
                        <span className="text-slate-500"> · {t(selectedRoute.durationKey)}</span>
                      ) : null}
                    </p>
                  </div>
                </div>

                {selectedRoutePoints.length > 0 && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {t('taxiGuestBooking.pointsCoveredTitle', {
                        tour: t(selectedRoute.nameKey),
                        duration: selectedRoute.durationKey ? t(selectedRoute.durationKey) : '',
                      })}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{t('taxiGuestBooking.pointsCoveredHint')}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {selectedRoutePoints.map((spot) => (
                        <div key={spot} className="flex gap-2 text-sm text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-sm bg-primary" aria-hidden />
                          <span>{spot}</span>
                        </div>
                      ))}
                    </div>
                    {selectedRoute.noteKey ? (
                      <p className="mt-3 text-xs italic text-slate-500">{t(selectedRoute.noteKey)}</p>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('taxiGuestBooking.passengerCount')}
                type="number"
                min="1"
                value={form.passengerCount}
                onChange={(e) => setField('passengerCount', e.target.value)}
              />
              {!openMode && (
                <Input
                  label={t('taxiGuestBooking.vehiclePreference')}
                  value={form.vehiclePreference}
                  onChange={(e) => setField('vehiclePreference', e.target.value)}
                  placeholder={item?.vehicleType || 'SEDAN, SUV, INNOVA'}
                />
              )}
            </div>
          </div>
          {openMode && (
            <p className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2.5 text-sm text-slate-700">
              {t('taxiGuestBooking.tollExtraNote')}
            </p>
          )}
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
            <Input label={t('taxiGuestBooking.mobile')} value={form.leadMobile} onChange={(e) => setField('leadMobile', e.target.value)} required />
            <Input label={t('taxiGuestBooking.email')} type="email" value={form.leadEmail} onChange={(e) => setField('leadEmail', e.target.value)} required />
            <Input
              className="sm:col-span-2"
              label={t('taxiGuestBooking.hotelOrPickupAddress')}
              value={form.leadAddress}
              onChange={(e) => setField('leadAddress', e.target.value)}
            />
            <Input label={t('taxiGuestBooking.cityState')} value={form.leadCityState} onChange={(e) => setField('leadCityState', e.target.value)} />
            <PincodeInput label={t('taxiGuestBooking.pinCode')} value={form.leadPincode} onChange={(e) => setField('leadPincode', e.target.value)} />
            <Input label={t('taxiGuestBooking.emergencyName')} value={form.emergencyName} onChange={(e) => setField('emergencyName', e.target.value)} />
            <Input label={t('taxiGuestBooking.emergencyMobile')} value={form.emergencyMobile} onChange={(e) => setField('emergencyMobile', e.target.value)} />
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('taxiGuestBooking.section3')}</SectionTitle>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('taxiGuestBooking.routeTripTypeLabel')}</label>
            <select
              className="input-field"
              value={form.routeTripType}
              onChange={(e) => {
                const nextType = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  routeTripType: nextType,
                  dropLocation: nextType === 'ROUND_TRIP' ? '' : prev.dropLocation,
                }));
              }}
            >
              <option value="ROUND_TRIP">{t('taxiGuestBooking.routeTripTypes.roundTrip')}</option>
              <option value="ONE_WAY">{t('taxiGuestBooking.routeTripTypes.oneWay')}</option>
              <option value="DROP">{t('taxiGuestBooking.routeTripTypes.drop')}</option>
            </select>
          </div>
          <Input
            label={t('taxiGuestBooking.pickupLocation')}
            value={form.pickupLocation}
            onChange={(e) => setField('pickupLocation', e.target.value)}
            required
          />
          {needsDropLocation && (
            <Input
              label={t('taxiGuestBooking.dropLocation')}
              value={form.dropLocation}
              onChange={(e) => setField('dropLocation', e.target.value)}
              required
            />
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('taxiGuestBooking.specialRequests')}</label>
            <textarea
              className="input-field min-h-[88px]"
              value={form.specialRequests}
              onChange={(e) => setField('specialRequests', e.target.value)}
            />
          </div>
        </Card>

        <ConfigurableFormSections
          sections={customSections}
          values={customValues}
          onChange={setCustomField}
        />

        <Card className="space-y-4">
          <SectionTitle>{t('taxiGuestBooking.section4')}</SectionTitle>
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
            {/* GST temporarily disabled
            <div className="mt-1 flex justify-between">
              <span>{t('taxiGuestBooking.gstLabel')}</span>
              <span>{formatCurrency(gst)}</span>
            </div>
            */}
            <div className="mt-2 flex justify-between font-bold text-primary">
              <span>{t('taxiGuestBooking.totalLabel')}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">{t('taxiGuestBooking.directDriverPaymentNote')}</p>
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
