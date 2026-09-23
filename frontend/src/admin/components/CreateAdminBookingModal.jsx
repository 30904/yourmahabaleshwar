import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createAdminBooking,
  fetchAdminCustomers,
  fetchAdminGuides,
  fetchAdminDrivers,
  fetchAdminProperties,
  fetchAdminProperty,
  fetchAdminListingReview,
} from '../../services/enterpriseAdminApi';
import api from '../../services/api';
import { BOOKING_SOURCE } from '../../constants/bookingSource';

const KINDS = [
  { id: 'GUIDE', label: 'Guide' },
  { id: 'TAXI', label: 'Taxi' },
  { id: 'DRIVER', label: 'Driver' },
  { id: 'HORSE', label: 'Horse' },
  { id: 'TENT', label: 'Tent' },
  { id: 'HOTEL', label: 'Hotel' },
  { id: 'RESORT', label: 'Resort' },
  { id: 'HOMESTAY', label: 'Homestay / Villa' },
];

const emptyForm = {
  bookingSource: BOOKING_SOURCE.CALL,
  bookingKind: 'GUIDE',
  customerId: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  checkIn: '',
  checkOut: '',
  startTime: '09:00',
  listingId: '',
  roomId: '',
  subtotal: '',
  guidePackage: '6HR',
  bikeAddon: false,
  tentQuantity: '1',
  adults: '2',
  children: '0',
  status: 'PENDING',
  paymentStatus: 'PENDING',
  notes: '',
};

export default function CreateAdminBookingModal({ onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [customers, setCustomers] = useState([]);
  const [listings, setListings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [saving, setSaving] = useState(false);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    fetchAdminCustomers()
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingLists(true);
      setForm((prev) => ({ ...prev, listingId: '', roomId: '' }));
      setListings([]);
      setRooms([]);
      try {
        const kind = form.bookingKind;
        let items = [];
        if (kind === 'GUIDE') items = await fetchAdminGuides();
        else if (kind === 'TAXI') items = await fetchAdminDrivers({ vendorType: 'TAXI' });
        else if (kind === 'DRIVER') items = await fetchAdminDrivers({ vendorType: 'DRIVER' });
        else if (kind === 'HORSE') {
          const res = await api.get('/admin/enterprise/horses');
          items = res.data.data || [];
        } else if (kind === 'TENT') {
          const data = await fetchAdminProperties({ type: 'TENT', limit: 100 });
          items = data.tents || [];
        } else if (kind === 'HOTEL' || kind === 'RESORT') {
          const data = await fetchAdminProperties({ type: kind, limit: 100 });
          items = data.hotels || [];
        } else if (kind === 'HOMESTAY') {
          const res = await api.get('/admin/enterprise/homestays');
          items = res.data.data || [];
        }
        if (!cancelled) setListings(Array.isArray(items) ? items : []);
      } catch {
        if (!cancelled) {
          toast.error('Failed to load listings');
          setListings([]);
        }
      } finally {
        if (!cancelled) setLoadingLists(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [form.bookingKind]);

  useEffect(() => {
    setForm((prev) => (prev.roomId ? { ...prev, roomId: '' } : prev));

    const listing = listings.find((l) => String(l._id) === String(form.listingId));
    if (!listing) {
      setRooms([]);
      return;
    }
    if (form.bookingKind === 'HOMESTAY') {
      setRooms(Array.isArray(listing.rooms) ? listing.rooms : []);
      return;
    }
    if (form.bookingKind === 'HOTEL' || form.bookingKind === 'RESORT') {
      if (Array.isArray(listing.rooms) && listing.rooms.length) {
        setRooms(listing.rooms);
        return;
      }
      let cancelled = false;
      const loadRooms = async () => {
        try {
          const data = await fetchAdminProperty(listing._id);
          if (cancelled) return;
          if (Array.isArray(data?.rooms) && data.rooms.length) {
            setRooms(data.rooms);
            return;
          }
          const review = await fetchAdminListingReview(listing._id, form.bookingKind);
          if (!cancelled) setRooms(Array.isArray(review?.rooms) ? review.rooms : []);
        } catch {
          if (!cancelled) setRooms([]);
        }
      };
      loadRooms();
      return () => {
        cancelled = true;
      };
    }
    setRooms([]);
  }, [form.listingId, form.bookingKind, listings]);

  const listingOptions = useMemo(
    () =>
      listings.map((item) => ({
        id: item._id,
        label: item.name || item.title || item.vehicleType || String(item._id),
      })),
    [listings]
  );

  const onCustomerPick = (id) => {
    setField('customerId', id);
    const c = customers.find((x) => String(x._id) === String(id));
    if (c) {
      setField('customerName', c.name || '');
      setField('customerPhone', c.phone || '');
      setField('customerEmail', c.email || '');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.bookingSource) {
      toast.error('Select Call booking or Walk in');
      return;
    }
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      toast.error('Customer name and mobile are required');
      return;
    }
    if (!form.checkIn) {
      toast.error('Date is required');
      return;
    }
    setSaving(true);
    try {
      await createAdminBooking({
        bookingSource: form.bookingSource,
        bookingKind: form.bookingKind,
        customerId: form.customerId || undefined,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        checkIn: form.checkIn,
        checkOut: form.checkOut || undefined,
        startTime: form.startTime,
        listingId: form.listingId || undefined,
        roomId: form.roomId || undefined,
        subtotal: form.subtotal !== '' ? Number(form.subtotal) : undefined,
        guidePackage: form.guidePackage,
        bikeAddon: form.bikeAddon,
        tentQuantity: form.tentQuantity,
        adults: form.adults,
        children: form.children,
        status: form.status,
        paymentStatus: form.paymentStatus,
        notes: form.notes,
      });
      toast.success('Booking created');
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const needsRoom = form.bookingKind === 'HOTEL' || form.bookingKind === 'RESORT' || form.bookingKind === 'HOMESTAY';
  const needsCheckOut =
    form.bookingKind === 'TENT' || needsRoom;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="mt-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Create booking</h2>
            <p className="text-sm text-slate-500">For call or walk-in customers</p>
          </div>
          <button type="button" className="text-slate-500 hover:text-slate-800" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <fieldset className="rounded-xl border border-slate-200 p-3">
            <legend className="px-1 text-sm font-semibold text-slate-800">Booking source</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="bookingSource"
                  checked={form.bookingSource === BOOKING_SOURCE.CALL}
                  onChange={() => setField('bookingSource', BOOKING_SOURCE.CALL)}
                />
                <span className="font-medium text-blue-600">Call booking</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="bookingSource"
                  checked={form.bookingSource === BOOKING_SOURCE.WALK_IN}
                  onChange={() => setField('bookingSource', BOOKING_SOURCE.WALK_IN)}
                />
                <span className="font-medium text-emerald-600">Walk in</span>
              </label>
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Type</span>
              <select className="admin-input" value={form.bookingKind} onChange={(e) => setField('bookingKind', e.target.value)}>
                {KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Existing customer (optional)</span>
              <select className="admin-input" value={form.customerId} onChange={(e) => onCustomerPick(e.target.value)}>
                <option value="">New / enter details below</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.phone ? `· ${c.phone}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm sm:col-span-1">
              <span className="mb-1 block font-medium text-slate-700">Customer name *</span>
              <input className="admin-input" value={form.customerName} onChange={(e) => setField('customerName', e.target.value)} required />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Mobile *</span>
              <input className="admin-input" value={form.customerPhone} onChange={(e) => setField('customerPhone', e.target.value)} required />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Email</span>
              <input className="admin-input" type="email" value={form.customerEmail} onChange={(e) => setField('customerEmail', e.target.value)} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">{needsCheckOut ? 'Check-in / date *' : 'Date *'}</span>
              <input className="admin-input" type="date" value={form.checkIn} onChange={(e) => setField('checkIn', e.target.value)} required />
            </label>
            {needsCheckOut && (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Check-out</span>
                <input className="admin-input" type="date" value={form.checkOut} onChange={(e) => setField('checkOut', e.target.value)} />
              </label>
            )}
            {!needsRoom && form.bookingKind !== 'TENT' && (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Start time</span>
                <input className="admin-input" type="time" value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} />
              </label>
            )}
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Amount (₹)</span>
              <input
                className="admin-input"
                type="number"
                min="0"
                placeholder="Auto if blank"
                value={form.subtotal}
                onChange={(e) => setField('subtotal', e.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Listing {needsRoom ? '*' : '(optional — leave empty for unassigned)'}
              </span>
              <select
                className="admin-input"
                value={form.listingId}
                onChange={(e) => setField('listingId', e.target.value)}
                disabled={loadingLists}
                required={needsRoom}
              >
                <option value="">{loadingLists ? 'Loading…' : '— Select —'}</option>
                {listingOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {needsRoom && (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Room *</span>
                <select
                  className="admin-input"
                  value={form.roomId}
                  onChange={(e) => setField('roomId', e.target.value)}
                  required
                  disabled={!form.listingId}
                >
                  <option value="">
                    {!form.listingId
                      ? '— Select listing first —'
                      : rooms.length
                        ? '— Select room —'
                        : '— No rooms found for this listing —'}
                  </option>
                  {rooms.map((r) => (
                    <option key={r._id || r.id} value={r._id || r.id}>
                      {r.name || r.type || r._id} {r.basePrice != null ? `· ₹${r.basePrice}` : ''}
                    </option>
                  ))}
                </select>
                {form.listingId && rooms.length === 0 && (
                  <span className="mt-1 block text-xs text-amber-600">
                    Add rooms on the property page, then try again.
                  </span>
                )}
              </label>
            )}
          </div>

          {form.bookingKind === 'GUIDE' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Package</span>
                <select className="admin-input" value={form.guidePackage} onChange={(e) => setField('guidePackage', e.target.value)}>
                  <option value="4HR">4 hours</option>
                  <option value="6HR">6 hours</option>
                  <option value="8HR">8 hours</option>
                  <option value="12HR">12 hours</option>
                </select>
              </label>
              <label className="mt-6 inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.bikeAddon} onChange={(e) => setField('bikeAddon', e.target.checked)} />
                Bike add-on
              </label>
            </div>
          )}

          {form.bookingKind === 'TENT' && (
            <label className="block text-sm max-w-[12rem]">
              <span className="mb-1 block font-medium text-slate-700">Tent quantity</span>
              <input className="admin-input" type="number" min="1" value={form.tentQuantity} onChange={(e) => setField('tentQuantity', e.target.value)} />
            </label>
          )}

          {needsRoom && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Adults</span>
                <input className="admin-input" type="number" min="1" value={form.adults} onChange={(e) => setField('adults', e.target.value)} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Children</span>
                <input className="admin-input" type="number" min="0" value={form.children} onChange={(e) => setField('children', e.target.value)} />
              </label>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Status</span>
              <select className="admin-input" value={form.status} onChange={(e) => setField('status', e.target.value)}>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Payment</span>
              <select className="admin-input" value={form.paymentStatus} onChange={(e) => setField('paymentStatus', e.target.value)}>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Notes</span>
            <textarea className="admin-input min-h-[72px]" value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="admin-btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
