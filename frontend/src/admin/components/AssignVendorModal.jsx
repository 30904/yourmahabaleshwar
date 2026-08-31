import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  fetchAdminGuides,
  fetchAdminDrivers,
  fetchAdminProperties,
} from '../../services/enterpriseAdminApi';
import { assignBookingVendor } from '../../services/serviceMonetizationApi';
import api from '../../services/api';

function vendorIdFromListing(listing, tenant) {
  if (tenant === 'GUIDE' || tenant === 'TAXI' || tenant === 'DRIVER') {
    return listing.user?._id || listing.user;
  }
  return listing.operator?._id || listing.operator;
}

export default function AssignVendorModal({ booking, onClose, onAssigned }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listingId, setListingId] = useState('');
  const [saving, setSaving] = useState(false);

  const tenant = booking?.serviceTenant;

  useEffect(() => {
    if (!tenant) return;
    setLoading(true);
    const load = async () => {
      try {
        if (tenant === 'GUIDE') {
          setListings(await fetchAdminGuides());
        } else if (tenant === 'TAXI') {
          setListings(await fetchAdminDrivers({ vendorType: 'TAXI' }));
        } else if (tenant === 'DRIVER') {
          setListings(await fetchAdminDrivers({ vendorType: 'DRIVER' }));
        } else if (tenant === 'TENT') {
          const data = await fetchAdminProperties({ type: 'TENT', limit: 100 });
          setListings(data.tents || []);
        } else if (tenant === 'HORSE') {
          const res = await api.get('/admin/enterprise/horses');
          setListings(res.data.data || []);
        } else {
          setListings([]);
        }
      } catch {
        toast.error('Failed to load vendors');
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenant]);

  const options = useMemo(
    () =>
      listings.map((item) => ({
        id: item._id,
        label: item.name || item.title || item.vehicleType || item._id,
        vendorId: vendorIdFromListing(item, tenant),
      })),
    [listings, tenant]
  );

  const submit = async (e) => {
    e.preventDefault();
    const selected = options.find((o) => o.id === listingId);
    if (!selected?.vendorId) {
      toast.error('Select a vendor listing');
      return;
    }
    setSaving(true);
    try {
      await assignBookingVendor(booking._id, { vendorId: selected.vendorId, listingId: selected.id });
      toast.success('Vendor assigned');
      onAssigned?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setSaving(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">Assign vendor</h3>
        <p className="mt-1 text-sm text-slate-600">
          Booking {booking.bookingNumber || booking._id} · {tenant}
        </p>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <label className="admin-label block">
            Vendor listing
            <select
              className="admin-input mt-1 w-full"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">{loading ? 'Loading…' : 'Select listing'}</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="admin-btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary" disabled={saving || loading}>
              {saving ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
