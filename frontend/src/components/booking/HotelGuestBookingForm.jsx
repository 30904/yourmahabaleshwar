import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { calcGST, formatCurrency } from '../../utils/format';
import { createHotelBooking } from '../../services/bookingsApi';
import { fetchAvailability } from '../../services/listingsApi';
import { payForBooking } from '../../services/paymentsApi';
import { useAuth } from '../../context/AuthContext';
import {
  HOTEL_BOOKING_TERMS_AND_CONDITIONS,
  HOTEL_GUEST_BOOKING_TERMS,
} from '../../constants/hotelPartnerLegal';

const emptyTraveller = () => ({ fullName: '', age: '', gender: '', relationship: '' });

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-slate-900">{children}</h3>;
}

function LegalModal({ open, onClose }) {
  if (!open) return null;
  const doc = HOTEL_BOOKING_TERMS_AND_CONDITIONS;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" onClick={onClose} role="presentation">
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">{doc.title}</h2>
          <button type="button" className="text-sm font-semibold text-slate-500" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-4 space-y-4 text-sm text-slate-700">
          {doc.sections.map((section) => (
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

export default function HotelGuestBookingForm({ hotel, rooms = [], initialRoomId }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const propertyLabel = hotel?.type === 'RESORT' ? 'Resort' : 'Hotel';
  const roomList = rooms?.length ? rooms : hotel?.rooms || [];
  const [unavailable, setUnavailable] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [form, setForm] = useState(() => ({
    checkIn: '',
    checkOut: '',
    checkInTime: hotel?.checkInTime || '14:00',
    checkOutTime: hotel?.checkOutTime || '11:00',
    roomId: initialRoomId || roomList[0]?._id || '',
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
    coTravellers: [emptyTraveller(), emptyTraveller(), emptyTraveller()],
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

  useEffect(() => {
    if (initialRoomId) setField('roomId', initialRoomId);
  }, [initialRoomId]);

  const room = useMemo(
    () => roomList.find((r) => String(r._id) === String(form.roomId)) || roomList[0],
    [roomList, form.roomId]
  );

  const nights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 1;
    return Math.max(1, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000));
  }, [form.checkIn, form.checkOut]);

  const subtotal = (room?.basePrice || hotel?.priceFrom || 0) * nights;
  const gst = calcGST(subtotal);
  const total = subtotal + gst;
  const dateBlocked = form.checkIn && unavailable.includes(form.checkIn);

  useEffect(() => {
    if (!hotel?._id || !form.checkIn) return;
    fetchAvailability('hotel', hotel._id, form.checkIn, form.checkOut || form.checkIn)
      .then((d) => setUnavailable(d.unavailable || []))
      .catch(() => setUnavailable([]));
  }, [hotel?._id, form.checkIn, form.checkOut]);

  const validate = () => {
    if (!form.checkIn || !form.checkOut) return 'Check-in and check-out dates are required';
    if (dateBlocked) return t('booking.unavailable');
    if (!form.roomId && !roomList[0]?._id) return 'Please select a room';
    if (!String(form.leadFullName || '').trim()) return 'Lead guest full name is required';
    if (!String(form.leadMobile || '').trim()) return 'Mobile number is required';
    if (!String(form.idType || '').trim() || !String(form.idNumber || '').trim()) return 'ID proof type and number are required';
    if (Number(form.adults) < 1) return 'At least 1 adult is required';
    if (!form.acceptTerms) return 'Please accept the Terms and Conditions';
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
      const res = await createHotelBooking({
        hotelId: hotel._id,
        roomId: form.roomId || roomList[0]?._id,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: { adults: Number(form.adults) || 1, children: Number(form.children) || 0 },
        guestRegistration: {
          formDate: new Date().toISOString(),
          checkInTime: form.checkInTime,
          checkOutTime: form.checkOutTime,
          adults: Number(form.adults) || 1,
          children: Number(form.children) || 0,
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
            purpose: form.purpose || '',
          },
          idProof: {
            type: form.idType,
            number: form.idNumber,
            nationality: form.nationality || 'INDIAN',
          },
          coTravellers: (form.coTravellers || []).filter((c) => String(c.fullName || '').trim()),
          roomLabel: room?.name,
          totalNights: nights,
          tariff: room?.basePrice || 0,
          advanceAmount: form.advanceAmount !== '' ? Number(form.advanceAmount) : total,
          paymentMode: form.paymentMode || 'ONLINE',
          acceptTerms: true,
          acceptedTermsAt: new Date().toISOString(),
        },
      });
      const booking = res.data.data;
      toast.success('Booking created — proceed to pay');
      try {
        await payForBooking(booking, user);
        toast.success('Payment successful');
      } catch {
        toast('Booking saved. You can pay from My Bookings.');
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{propertyLabel} booking Form</h2>
            <p className="mt-1 text-sm text-slate-500">S.M. Enterprises — guest details for {hotel?.name}</p>
          </div>
          <p className="text-sm text-slate-500">Date: {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <Card className="space-y-4">
          <SectionTitle>Stay dates & room</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Check-in date" type="date" value={form.checkIn} onChange={(e) => setField('checkIn', e.target.value)} required />
            <Input label="Check-in time" type="time" value={form.checkInTime} onChange={(e) => setField('checkInTime', e.target.value)} />
            <Input label="Check-out date" type="date" value={form.checkOut} onChange={(e) => setField('checkOut', e.target.value)} required />
            <Input label="Check-out time" type="time" value={form.checkOutTime} onChange={(e) => setField('checkOutTime', e.target.value)} />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Room</label>
              <select className="input-field" value={form.roomId} onChange={(e) => setField('roomId', e.target.value)}>
                {roomList.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} — {formatCurrency(r.basePrice)} / night
                  </option>
                ))}
              </select>
            </div>
          </div>
          {dateBlocked && <p className="text-sm text-red-600">{t('booking.unavailable')}</p>}
        </Card>

        <Card className="space-y-4">
          <SectionTitle>1. Lead Guest Details</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              className="sm:col-span-2"
              label="Full Name"
              value={form.leadFullName}
              onChange={(e) => setField('leadFullName', e.target.value)}
              required
            />
            <Input label="Age" type="number" min="1" value={form.leadAge} onChange={(e) => setField('leadAge', e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Gender</label>
              <select className="input-field" value={form.leadGender} onChange={(e) => setField('leadGender', e.target.value)}>
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <Input label="Mobile" value={form.leadMobile} onChange={(e) => setField('leadMobile', e.target.value)} required />
            <Input label="Email" type="email" value={form.leadEmail} onChange={(e) => setField('leadEmail', e.target.value)} />
            <Input
              className="sm:col-span-2"
              label="Permanent Address"
              value={form.leadAddress}
              onChange={(e) => setField('leadAddress', e.target.value)}
            />
            <Input label="City & State" value={form.leadCityState} onChange={(e) => setField('leadCityState', e.target.value)} />
            <Input label="Pin Code" value={form.leadPincode} onChange={(e) => setField('leadPincode', e.target.value)} />
            <Input label="Coming From" value={form.comingFrom} onChange={(e) => setField('comingFrom', e.target.value)} />
            <Input label="Going To" value={form.goingTo} onChange={(e) => setField('goingTo', e.target.value)} />
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-700">Purpose of visit</p>
              <div className="flex flex-wrap gap-4 text-sm">
                {[
                  ['TOURISM', 'Tourism'],
                  ['BUSINESS', 'Business'],
                  ['PERSONAL', 'Personal'],
                ].map(([value, label]) => (
                  <label key={value} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="hotelPurpose"
                      checked={form.purpose === value}
                      onChange={() => setField('purpose', value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>2. ID Proof & Nationality</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-700">ID type</p>
              <div className="flex flex-wrap gap-4 text-sm">
                {[
                  ['AADHAAR', 'Aadhaar Card'],
                  ['VOTER', 'Voter ID'],
                  ['DRIVING_LICENSE', 'Driving Licence'],
                  ['PASSPORT', 'Passport'],
                ].map(([value, label]) => (
                  <label key={value} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="hotelIdType"
                      checked={form.idType === value}
                      onChange={() => setField('idType', value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <Input label="ID Number" value={form.idNumber} onChange={(e) => setField('idNumber', e.target.value)} required />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Nationality</label>
              <select className="input-field" value={form.nationality} onChange={(e) => setField('nationality', e.target.value)}>
                <option value="INDIAN">Indian</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>3. Co-travellers Details</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Adults" type="number" min="1" value={form.adults} onChange={(e) => setField('adults', e.target.value)} />
            <Input label="Children" type="number" min="0" value={form.children} onChange={(e) => setField('children', e.target.value)} />
          </div>
          <div className="space-y-3">
            {(form.coTravellers || []).map((c, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-4">
                <Input
                  className="sm:col-span-2"
                  label={`Guest ${index + 1} Full Name`}
                  value={c.fullName}
                  onChange={(e) => setTraveller(index, 'fullName', e.target.value)}
                />
                <Input label="Age" type="number" min="0" value={c.age} onChange={(e) => setTraveller(index, 'age', e.target.value)} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Gender</label>
                  <select className="input-field" value={c.gender} onChange={(e) => setTraveller(index, 'gender', e.target.value)}>
                    <option value="">Select</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <Input
                  className="sm:col-span-2"
                  label="Relationship"
                  value={c.relationship}
                  onChange={(e) => setTraveller(index, 'relationship', e.target.value)}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>4. Room & Payment Details</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">Room</p>
              <p className="font-semibold text-slate-900">{room?.name || '—'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">Total nights</p>
              <p className="font-semibold text-slate-900">{nights}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">Tariff / night</p>
              <p className="font-semibold text-slate-900">{formatCurrency(room?.basePrice || 0)}</p>
            </div>
            <Input
              label="Advance amount (₹)"
              type="number"
              min="0"
              value={form.advanceAmount}
              onChange={(e) => setField('advanceAmount', e.target.value)}
              placeholder={String(total || '')}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Payment mode</p>
            <div className="flex flex-wrap gap-4 text-sm">
              {[
                ['CASH', 'Cash'],
                ['ONLINE', 'Online / UPI'],
                ['CARD', 'Card'],
              ].map(([value, label]) => (
                <label key={value} className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="hotelPaymentMode"
                    checked={form.paymentMode === value}
                    onChange={() => setField('paymentMode', value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Online bookings are completed via the platform payment gateway after you confirm.</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal ({nights} night{nights > 1 ? 's' : ''})</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>GST (12%)</span>
              <span>{formatCurrency(gst)}</span>
            </div>
            <div className="mt-2 flex justify-between font-bold text-primary">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Terms & Conditions</SectionTitle>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            {HOTEL_GUEST_BOOKING_TERMS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button type="button" className="text-sm font-semibold text-primary underline" onClick={() => setLegalOpen(true)}>
            Read full Terms & Conditions
          </button>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.acceptTerms}
              onChange={(e) => setField('acceptTerms', e.target.checked)}
            />
            <span>I have read and agree to the Hotel Booking Terms and Conditions of S.M. Enterprises.</span>
          </label>
        </Card>

        <Button type="submit" className="w-full sm:w-auto" disabled={dateBlocked || submitting || !roomList.length}>
          {submitting ? t('common.loading') : t('booking.confirm')}
        </Button>
      </form>

      <LegalModal open={legalOpen} onClose={() => setLegalOpen(false)} />
    </>
  );
}
