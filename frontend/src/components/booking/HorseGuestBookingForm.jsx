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
import { createHorseBooking } from '../../services/bookingsApi';
import { fetchAvailability } from '../../services/listingsApi';
import { payForBooking } from '../../services/paymentsApi';
import { useAuth } from '../../context/AuthContext';
import {
  DEFAULT_HORSE_PACKAGE_ID,
  HORSE_CLIENT_PACKAGES,
  openHorseRoutesForI18n,
} from '../../constants/horseClientRateChart';
import { useGroupMemberSync } from '../../hooks/useCoTravellerSync';

const emptyMember = () => ({ fullName: '', age: '', gender: '', relationship: '' });

function routeKey(route, index) {
  return String(route?._id ?? index);
}

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

export default function HorseGuestBookingForm({ item, openMode = false }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unavailable, setUnavailable] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  const openModeRoutes = useMemo(() => openHorseRoutesForI18n(t), [t, i18n.language]);

  const routes = openMode ? openModeRoutes : item?.routes || [];
  const defaultRouteId = routes[0] ? routeKey(routes[0], 0) : '';

  const termsSummary = useMemo(() => {
    const lines = t('horseGuestBooking.termsSummary', { returnObjects: true });
    return Array.isArray(lines) ? lines : [];
  }, [t, i18n.language]);

  const fullTermsSections = useMemo(() => {
    const sections = t('horseGuestBooking.fullTermsSections', { returnObjects: true });
    return Array.isArray(sections) ? sections : [];
  }, [t, i18n.language]);

  const [form, setForm] = useState(() => ({
    rideDate: '',
    startTime: '09:00',
    routeId: defaultRouteId,
    riderCount: 1,
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
    meetingPoint: '',
    specialRequests: '',
    groupMembers: [],
    paymentMode: 'ONLINE',
    advanceAmount: '',
    acceptSafety: false,
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

  const selectedRoute = useMemo(() => {
    const match = routes.find((r, idx) => routeKey(r, idx) === String(form.routeId));
    return match || routes[0];
  }, [routes, form.routeId]);

  const subtotal = selectedRoute?.price || item?.priceFrom || 0;
  const gst = calcGST(subtotal);
  const total = subtotal + gst;
  const dateBlocked = form.rideDate && unavailable.includes(form.rideDate);

  useEffect(() => {
    if (openMode || !item?._id || !form.rideDate) return;
    fetchAvailability('horse', item._id, form.rideDate, form.rideDate)
      .then((d) => setUnavailable(d.unavailable || []))
      .catch(() => setUnavailable([]));
  }, [openMode, item?._id, form.rideDate]);

  useEffect(() => {
    if (form.routeId || !defaultRouteId) return;
    setField('routeId', defaultRouteId);
  }, [defaultRouteId, form.routeId]);

  useGroupMemberSync(form.riderCount, setForm, emptyMember);

  const validate = () => {
    if (!form.rideDate) return t('horseGuestBooking.validation.rideDate');
    if (dateBlocked) return t('horseGuestBooking.validation.unavailable');
    if (!form.routeId) return t('horseGuestBooking.validation.route');
    if (!String(form.leadFullName || '').trim()) return t('horseGuestBooking.validation.fullName');
    if (!String(form.leadMobile || '').trim()) return t('horseGuestBooking.validation.mobile');
    if (!form.acceptSafety) return t('horseGuestBooking.validation.acceptSafety');
    if (!form.acceptTerms) return t('horseGuestBooking.validation.acceptTerms');
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

      const res = await createHorseBooking({
        open: openMode,
        horseId: openMode ? undefined : item._id,
        routeId: form.routeId,
        checkIn: form.rideDate,
        guestRegistration: {
          formDate: new Date().toISOString(),
          checkInTime: form.startTime,
          adults: Number(form.riderCount) || 1,
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
          horseDetails: {
            routeId: form.routeId,
            routeName: selectedRoute?.name || '',
            durationMinutes: selectedRoute?.durationMinutes || 30,
            startTime: form.startTime,
            riderCount: Number(form.riderCount) || 1,
            meetingPoint: form.meetingPoint,
            specialRequests,
            safetyAcknowledged: !!form.acceptSafety,
            routePrice: subtotal,
          },
        },
      });
      const booking = res.data.data;
      toast.success(openMode ? t('serviceBooking.requestSubmitted') : t('horseGuestBooking.bookingCreated'));
      if (!openMode) {
        try {
          await payForBooking(booking, user);
          toast.success(t('horseGuestBooking.paymentSuccess'));
        } catch {
          toast(t('horseGuestBooking.bookingSavedPayLater'));
        }
      }
      navigate('/dashboard/customer/bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || t('horseGuestBooking.bookingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!openMode && !routes.length) {
    return (
      <Card className="text-sm text-slate-600">
        {t('horseGuestBooking.noRoutes')}
      </Card>
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className={`flex flex-wrap items-end gap-3 ${openMode ? 'service-booking-form-toolbar' : 'justify-between'}`}>
          {!openMode && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t('horseGuestBooking.formTitle')}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('horseGuestBooking.formSubtitle', { name: item?.name })}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <FormLanguageToggle />
            <p className="form-date text-sm text-slate-500">
              {t('horseGuestBooking.formDate')}: {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <Card className="space-y-4">
          <SectionTitle>{t('horseGuestBooking.section1')}</SectionTitle>
          {openMode && (
            <ServiceRateChartToggle
              seeLabel={t('serviceBooking.seeRateChart')}
              hideLabel={t('serviceBooking.hideRateChart')}
            >
              <p className="font-semibold text-slate-900">{t('horseGuestBooking.rateChartTitle')}</p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="py-2 pr-3 font-medium">{t('horseGuestBooking.chartPackage')}</th>
                      <th className="py-2 pr-3 font-medium">{t('horseGuestBooking.chartDetails')}</th>
                      <th className="py-2 font-medium">{t('horseGuestBooking.chartRate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HORSE_CLIENT_PACKAGES.map((pkg) => (
                      <tr key={pkg.id} className="border-b border-slate-100">
                        <td className="py-2 pr-3">{t(pkg.nameKey)}</td>
                        <td className="py-2 pr-3">{t(pkg.detailsKey)}</td>
                        <td className="py-2 font-semibold">{formatCurrency(pkg.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-600">{t('horseGuestBooking.openRateHint')}</p>
            </ServiceRateChartToggle>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label={t('horseGuestBooking.rideDate')}
              type="date"
              value={form.rideDate}
              onChange={(e) => setField('rideDate', e.target.value)}
              required
            />
            <Input
              label={t('horseGuestBooking.startTime')}
              type="time"
              value={form.startTime}
              onChange={(e) => setField('startTime', e.target.value)}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {t('horseGuestBooking.routeLabel')}
              </label>
              <select
                className="input-field"
                value={form.routeId}
                onChange={(e) => setField('routeId', e.target.value)}
              >
                {routes.map((r, idx) => (
                  <option key={routeKey(r, idx)} value={routeKey(r, idx)}>
                    {r.name}
                    {r.durationMinutes ? ` — ${r.durationMinutes} ${t('horseGuestBooking.minutes')}` : ''}
                    {' — '}
                    {formatCurrency(r.price)}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={t('horseGuestBooking.riderCount')}
              type="number"
              min="1"
              max="10"
              value={form.riderCount}
              onChange={(e) => setField('riderCount', e.target.value)}
            />
            {selectedRoute?.description && (
              <p className="sm:col-span-2 lg:col-span-3 text-sm text-slate-600">{selectedRoute.description}</p>
            )}
          </div>
          {dateBlocked && <p className="text-sm text-red-600">{t('horseGuestBooking.validation.unavailable')}</p>}
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('horseGuestBooking.section2')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              className="sm:col-span-2"
              label={t('horseGuestBooking.fullName')}
              value={form.leadFullName}
              onChange={(e) => setField('leadFullName', e.target.value)}
              required
            />
            <Input label={t('horseGuestBooking.age')} type="number" min="1" value={form.leadAge} onChange={(e) => setField('leadAge', e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('horseGuestBooking.gender')}</label>
              <select className="input-field" value={form.leadGender} onChange={(e) => setField('leadGender', e.target.value)}>
                <option value="">{t('horseGuestBooking.selectGender')}</option>
                <option value="M">{t('horseGuestBooking.genderMale')}</option>
                <option value="F">{t('horseGuestBooking.genderFemale')}</option>
                <option value="OTHER">{t('horseGuestBooking.genderOther')}</option>
              </select>
            </div>
            <Input label={t('horseGuestBooking.mobile')} value={form.leadMobile} onChange={(e) => setField('leadMobile', e.target.value)} required />
            <Input label={t('horseGuestBooking.email')} type="email" value={form.leadEmail} onChange={(e) => setField('leadEmail', e.target.value)} />
            <Input
              className="sm:col-span-2"
              label={t('horseGuestBooking.address')}
              value={form.leadAddress}
              onChange={(e) => setField('leadAddress', e.target.value)}
            />
            <Input label={t('horseGuestBooking.cityState')} value={form.leadCityState} onChange={(e) => setField('leadCityState', e.target.value)} />
            <Input label={t('horseGuestBooking.pinCode')} value={form.leadPincode} onChange={(e) => setField('leadPincode', e.target.value)} />
            <Input label={t('horseGuestBooking.emergencyName')} value={form.emergencyName} onChange={(e) => setField('emergencyName', e.target.value)} />
            <Input label={t('horseGuestBooking.emergencyMobile')} value={form.emergencyMobile} onChange={(e) => setField('emergencyMobile', e.target.value)} />
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('horseGuestBooking.section3')}</SectionTitle>
          <Input
            label={t('horseGuestBooking.meetingPoint')}
            value={form.meetingPoint}
            onChange={(e) => setField('meetingPoint', e.target.value)}
            placeholder={item?.location || 'Mahabaleshwar'}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('horseGuestBooking.specialRequests')}</label>
            <textarea
              className="input-field min-h-[88px]"
              value={form.specialRequests}
              onChange={(e) => setField('specialRequests', e.target.value)}
            />
          </div>
        </Card>

        {(form.groupMembers || []).length > 0 && (
          <Card className="space-y-4">
            <SectionTitle>{t('horseGuestBooking.section4')}</SectionTitle>
            <div className="space-y-3">
              {(form.groupMembers || []).map((member, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-4">
                  <Input
                    className="sm:col-span-2"
                    label={t('horseGuestBooking.riderFullName', { n: index + 2 })}
                    value={member.fullName}
                    onChange={(e) => setMember(index, 'fullName', e.target.value)}
                  />
                  <Input label={t('horseGuestBooking.age')} type="number" min="0" value={member.age} onChange={(e) => setMember(index, 'age', e.target.value)} />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('horseGuestBooking.gender')}</label>
                    <select className="input-field" value={member.gender} onChange={(e) => setMember(index, 'gender', e.target.value)}>
                      <option value="">{t('horseGuestBooking.selectGender')}</option>
                      <option value="M">{t('horseGuestBooking.genderMale')}</option>
                      <option value="F">{t('horseGuestBooking.genderFemale')}</option>
                      <option value="OTHER">{t('horseGuestBooking.genderOther')}</option>
                    </select>
                  </div>
                  <Input
                    className="sm:col-span-2"
                    label={t('horseGuestBooking.relationship')}
                    value={member.relationship}
                    onChange={(e) => setMember(index, 'relationship', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="space-y-4">
          <SectionTitle>{t('horseGuestBooking.section5')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">{t('horseGuestBooking.routeSummary')}</p>
              <p className="font-semibold text-slate-900">{formatCurrency(subtotal)}</p>
              {selectedRoute && (
                <p className="mt-1 text-xs text-slate-500">
                  {selectedRoute.name} · {selectedRoute.durationMinutes} {t('horseGuestBooking.minutes')}
                </p>
              )}
            </div>
            <Input
              label={t('horseGuestBooking.advanceAmount')}
              type="number"
              min="0"
              value={form.advanceAmount}
              onChange={(e) => setField('advanceAmount', e.target.value)}
              placeholder={String(total || '')}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t('horseGuestBooking.paymentMode')}</p>
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
                  {t(`horseGuestBooking.${labelKey}`)}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{t('horseGuestBooking.paymentHint')}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>{t('horseGuestBooking.subtotalLabel')}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>{t('horseGuestBooking.gstLabel')}</span>
              <span>{formatCurrency(gst)}</span>
            </div>
            <div className="mt-2 flex justify-between font-bold text-primary">
              <span>{t('horseGuestBooking.totalLabel')}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t('horseGuestBooking.section6')}</SectionTitle>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            {termsSummary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button type="button" className="text-sm font-semibold text-primary underline" onClick={() => setLegalOpen(true)}>
            {t('horseGuestBooking.readFullTerms')}
          </button>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.acceptSafety}
              onChange={(e) => setField('acceptSafety', e.target.checked)}
            />
            <span>{t('horseGuestBooking.acceptSafety')}</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.acceptTerms}
              onChange={(e) => setField('acceptTerms', e.target.checked)}
            />
            <span>{t('horseGuestBooking.acceptTerms')}</span>
          </label>
        </Card>

        <Button type="submit" className="w-full sm:w-auto" disabled={dateBlocked || submitting}>
          {submitting ? t('common.loading') : openMode ? t('serviceBooking.submitRequest') : t('horseGuestBooking.confirmBooking')}
        </Button>
      </form>

      <LegalModal
        open={legalOpen}
        title={t('horseGuestBooking.fullTermsTitle')}
        sections={fullTermsSections}
        closeLabel={t('horseGuestBooking.close')}
        onClose={() => setLegalOpen(false)}
      />
    </>
  );
}
