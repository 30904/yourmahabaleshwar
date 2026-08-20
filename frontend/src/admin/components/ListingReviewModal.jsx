import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import AdminModal from './AdminModal';
import StatusBadge from './StatusBadge';
import {
  fetchAdminListingReview,
  setAdminPropertyActive,
  updateAdminProperty,
  updateHomestay,
  updateTent,
  updateHorse,
} from '../../services/enterpriseAdminApi';
import { formatCurrency } from '../../utils/format';
import { getMediaUrl } from '../../utils/mediaUrl';
import { listingStatusOf } from '../../utils/listingStatus';

const DOC_FIELDS = [
  ['Aadhaar number', 'aadhar'],
  ['Aadhaar document', 'aadharDoc'],
  ['PAN number', 'pan'],
  ['PAN document', 'panDoc'],
  ['GST number', 'gstNumber'],
  ['GST certificate', 'gstDoc'],
  ['Business registration', 'businessRegDoc'],
  ['Hotel license', 'hotelLicenseDoc'],
  ['Address proof', 'addressProofDoc'],
  ['Bank proof', 'bankProofDoc'],
  ['Driving license number', 'license'],
  ['Driving license document', 'licenseDoc'],
  ['Vehicle RC', 'rcDoc'],
  ['Insurance', 'insuranceDoc'],
  ['Fitness', 'fitnessDoc'],
  ['Permit', 'permitDoc'],
  ['PUC', 'pucDoc'],
  ['Guide license', 'guideLicenseDoc'],
];

const isFileValue = (value) =>
  typeof value === 'string' &&
  (value.startsWith('http') || value.startsWith('/') || value.startsWith('data:') || /\.(png|jpe?g|webp|gif|pdf)$/i.test(value));

function Info({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">{String(value)}</p>
    </div>
  );
}

function formFromListing(listing, rooms) {
  return {
    name: listing?.name || '',
    description: listing?.description || '',
    location: listing?.location && typeof listing.location === 'string' ? listing.location : listing?.address?.city || '',
    addressLine1: listing?.address?.line1 || '',
    city: listing?.address?.city || 'Mahabaleshwar',
    pincode: listing?.address?.pincode || '',
    checkInTime: listing?.checkInTime || '14:00',
    checkOutTime: listing?.checkOutTime || '11:00',
    policies: listing?.policies || '',
    gstNumber: listing?.gstNumber || '',
    contactPhone: listing?.contactPhone || listing?.vendor?.phone || '',
    amenities: (listing?.amenities || []).join(', '),
    images: (listing?.images || []).join('\n'),
    pricePerNight: listing?.pricePerNight ?? listing?.priceFrom ?? '',
    capacity: listing?.capacity ?? '',
    totalTents: listing?.totalTents ?? '',
    rooms: (rooms || []).map((room) => ({
      name: room.name || '',
      type: room.type || 'STANDARD',
      basePrice: room.basePrice || 0,
      capacity: room.capacity ?? 2,
      totalRooms: room.totalRooms ?? 1,
    })),
  };
}

export default function ListingReviewModal({ open, mode = 'view', listingType, listingId, onClose, onChanged }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(formFromListing(null, []));
  const [commissionRate, setCommissionRate] = useState('10');

  const type = String(listingType || 'HOTEL').toUpperCase();
  const editable = mode === 'edit';

  useEffect(() => {
    if (!open || !listingId) return undefined;
    let cancelled = false;
    setLoading(true);
    fetchAdminListingReview(listingId, type)
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setForm(formFromListing(payload.listing, payload.rooms));
        const rate = payload.listing?.commissionRate;
        setCommissionRate(rate != null && rate !== '' ? String(rate) : '10');
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load listing details');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, listingId, type]);

  const listing = data?.listing;
  const rooms = data?.rooms || [];
  const kyc = data?.kyc;
  const vendor = data?.vendor || listing?.vendor || listing?.operator;
  const status = listingStatusOf(listing || {});
  const parsedCommission = Number(commissionRate);
  const commissionValid = commissionRate !== '' && Number.isFinite(parsedCommission) && parsedCommission >= 0;

  const addressText = useMemo(() => {
    if (!listing) return '';
    if (listing.address) {
      return [listing.address.line1, listing.address.line2, listing.address.city, listing.address.state, listing.address.pincode]
        .filter(Boolean)
        .join(', ');
    }
    if (typeof listing.location === 'string') return listing.location;
    return '';
  }, [listing]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setRoom = (index, key, value) =>
    setForm((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room, i) => (i === index ? { ...room, [key]: value } : room)),
    }));

  const saveEdits = async () => {
    if (!listing) return;
    setSaving(true);
    try {
      const amenities = String(form.amenities || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const images = String(form.images || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const roomPayload = (form.rooms || []).map((room) => ({
        name: room.name,
        type: room.type || 'STANDARD',
        basePrice: Number(room.basePrice) || 0,
        capacity: Number(room.capacity) || 2,
        totalRooms: Number(room.totalRooms) || 1,
      }));

      if (type === 'TENT') {
        await updateTent(listing._id, {
          name: form.name,
          description: form.description,
          location: form.location,
          pricePerNight: Number(form.pricePerNight) || 0,
          capacity: Number(form.capacity) || 2,
          totalTents: Number(form.totalTents) || 1,
          amenities,
          images,
        });
      } else if (type === 'HOMESTAY') {
        await updateHomestay(listing._id, {
          name: form.name,
          description: form.description,
          location: form.location,
          contactPhone: form.contactPhone,
          priceFrom: Number(form.pricePerNight) || 0,
          amenities,
          images,
          rooms: roomPayload,
        });
      } else if (type === 'HORSE') {
        await updateHorse(listing._id, {
          name: form.name,
          description: form.description,
          location: form.location,
          priceFrom: Number(form.pricePerNight) || 0,
          images,
        });
      } else {
        await updateAdminProperty(listing._id, {
          name: form.name,
          type: listing.type || type,
          description: form.description,
          address: {
            line1: form.addressLine1,
            city: form.city,
            state: 'Maharashtra',
            pincode: form.pincode,
          },
          checkInTime: form.checkInTime,
          checkOutTime: form.checkOutTime,
          policies: form.policies,
          gstNumber: form.gstNumber,
          amenities,
          images,
          rooms: roomPayload,
          vendor: listing.vendor?._id || listing.vendor,
        });
      }
      toast.success('Listing updated');
      onChanged?.();
      const refreshed = await fetchAdminListingReview(listingId, type);
      setData(refreshed);
      setForm(formFromListing(refreshed.listing, refreshed.rooms));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const requestApprove = () => {
    if (!listing) return;
    if (!commissionValid) {
      toast.error('Enter a commission % before approving');
      return;
    }
    setConfirmAction('approve');
  };

  const requestReject = () => {
    if (!listing) return;
    setConfirmAction('reject');
  };

  const approve = async () => {
    if (!listing) return;
    if (!commissionValid) {
      toast.error('Enter a commission % before approving');
      setConfirmAction(null);
      return;
    }
    setActing('approve');
    try {
      await setAdminPropertyActive(listing._id, {
        isActive: true,
        listingType: type,
        commissionRate: parsedCommission,
      });
      toast.success('Listing approved and published');
      setConfirmAction(null);
      onChanged?.();
      onClose?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Approval failed');
    } finally {
      setActing('');
    }
  };

  const reject = async () => {
    if (!listing) return;
    setActing('reject');
    try {
      await setAdminPropertyActive(listing._id, {
        isActive: false,
        listingType: type,
      });
      toast.success('Listing rejected — hidden on the website');
      setConfirmAction(null);
      onChanged?.();
      onClose?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Reject failed');
    } finally {
      setActing('');
    }
  };

  const title = `${editable ? 'Edit' : 'View'} ${listing?.name || 'listing'}`;

  return (
    <>
    <AdminModal open={open} title={title} onClose={() => { setConfirmAction(null); onClose?.(); }} xl>
      {loading || !listing ? (
        <p className="py-10 text-center text-sm text-slate-500">{loading ? 'Loading listing…' : 'Listing not found'}</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{type}</span>
            </div>
            {editable && (
              <button type="button" className="admin-btn-primary" onClick={saveEdits} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            )}
          </div>

          <section className="space-y-3">
            <h4 className="admin-section-title">Listing details</h4>
            {editable ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="admin-label sm:col-span-2">
                  Name
                  <input className="admin-input" value={form.name} onChange={(e) => setField('name', e.target.value)} />
                </label>
                <label className="admin-label sm:col-span-2">
                  Description
                  <textarea className="admin-input min-h-[80px]" value={form.description} onChange={(e) => setField('description', e.target.value)} />
                </label>
                {(type === 'HOTEL' || type === 'RESORT') && (
                  <>
                    <label className="admin-label">
                      Address
                      <input className="admin-input" value={form.addressLine1} onChange={(e) => setField('addressLine1', e.target.value)} />
                    </label>
                    <label className="admin-label">
                      City
                      <input className="admin-input" value={form.city} onChange={(e) => setField('city', e.target.value)} />
                    </label>
                    <label className="admin-label">
                      Pincode
                      <input className="admin-input" value={form.pincode} onChange={(e) => setField('pincode', e.target.value)} />
                    </label>
                    <label className="admin-label">
                      GST number
                      <input className="admin-input" value={form.gstNumber} onChange={(e) => setField('gstNumber', e.target.value)} />
                    </label>
                    <label className="admin-label">
                      Check-in
                      <input className="admin-input" value={form.checkInTime} onChange={(e) => setField('checkInTime', e.target.value)} />
                    </label>
                    <label className="admin-label">
                      Check-out
                      <input className="admin-input" value={form.checkOutTime} onChange={(e) => setField('checkOutTime', e.target.value)} />
                    </label>
                    <label className="admin-label sm:col-span-2">
                      Policies
                      <textarea className="admin-input min-h-[64px]" value={form.policies} onChange={(e) => setField('policies', e.target.value)} />
                    </label>
                  </>
                )}
                {(type === 'TENT' || type === 'HOMESTAY' || type === 'HORSE') && (
                  <>
                    <label className="admin-label">
                      Location
                      <input className="admin-input" value={form.location} onChange={(e) => setField('location', e.target.value)} />
                    </label>
                    <label className="admin-label">
                      Price (₹)
                      <input type="number" className="admin-input" value={form.pricePerNight} onChange={(e) => setField('pricePerNight', e.target.value)} />
                    </label>
                  </>
                )}
                {type === 'HOMESTAY' && (
                  <label className="admin-label">
                    Contact phone
                    <input className="admin-input" value={form.contactPhone} onChange={(e) => setField('contactPhone', e.target.value)} />
                  </label>
                )}
                {type === 'TENT' && (
                  <>
                    <label className="admin-label">
                      Capacity
                      <input type="number" className="admin-input" value={form.capacity} onChange={(e) => setField('capacity', e.target.value)} />
                    </label>
                    <label className="admin-label">
                      Total tents
                      <input type="number" className="admin-input" value={form.totalTents} onChange={(e) => setField('totalTents', e.target.value)} />
                    </label>
                  </>
                )}
                <label className="admin-label sm:col-span-2">
                  Amenities (comma separated)
                  <input className="admin-input" value={form.amenities} onChange={(e) => setField('amenities', e.target.value)} />
                </label>
                <label className="admin-label sm:col-span-2">
                  Image URLs (one per line)
                  <textarea className="admin-input min-h-[72px]" value={form.images} onChange={(e) => setField('images', e.target.value)} />
                </label>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Vendor" value={vendor?.name ? `${vendor.name} (${vendor.email || vendor.phone || '—'})` : '—'} />
                <Info
                  label="Price range"
                  value={
                    listing.priceRangeFrom != null || listing.priceRangeTo != null
                      ? `${formatCurrency(listing.priceRangeFrom || 0)} – ${formatCurrency(listing.priceRangeTo || listing.priceRangeFrom || 0)}`
                      : formatCurrency(listing.priceFrom || listing.pricePerNight || rooms[0]?.basePrice)
                  }
                />
                <Info label="Owner / Partner" value={listing.ownerName} />
                <Info label="Address / location" value={addressText} />
                <Info label="Reception phone" value={listing.receptionPhone} />
                <Info label="WhatsApp" value={listing.whatsapp} />
                <Info label="Property email" value={listing.propertyEmail} />
                <Info label="Website" value={listing.website} />
                <Info label="GST" value={listing.gstNumber} />
                <Info label="Check-in / Check-out" value={listing.checkInTime && listing.checkOutTime ? `${listing.checkInTime} / ${listing.checkOutTime}` : ''} />
                <Info label="Contact" value={listing.contactPhone} />
                <Info label="Driver accommodation" value={listing.driverAccommodation === true ? 'Yes' : listing.driverAccommodation === false ? 'No' : ''} />
                <Info
                  label="Room inventory"
                  value={
                    listing.roomInventory
                      ? `Total ${listing.roomInventory.totalRooms || 0} · Non-AC ${listing.roomInventory.nonAc || 0} · Deluxe AC ${listing.roomInventory.deluxeAc || 0} · Suite ${listing.roomInventory.suite || 0} · Family/Dorm ${listing.roomInventory.familyDorm || 0}`
                      : ''
                  }
                />
                <Info label="Amenities" value={(listing.amenities || []).join(', ')} />
                <Info
                  label="Listing bank details"
                  value={
                    listing.bankDetails
                      ? [listing.bankDetails.accountHolder, listing.bankDetails.bankName, listing.bankDetails.branch, listing.bankDetails.accountNumber, listing.bankDetails.ifsc]
                          .filter(Boolean)
                          .join(' · ')
                      : ''
                  }
                />
                <Info
                  label="Legal acceptance"
                  value={
                    [
                      listing.acceptedTermsAt ? 'Terms' : null,
                      listing.acceptedAgreementAt ? 'Agreement' : null,
                      listing.declarationAcceptedAt ? 'Declaration' : null,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Not recorded'
                  }
                />
                <div className="sm:col-span-2">
                  <Info label="Description" value={listing.description || listing.shortDescription} />
                </div>
                <div className="sm:col-span-2">
                  <Info label="Cancellation / policies" value={listing.cancellationPolicyText || listing.policies} />
                </div>
              </div>
            )}

            {(editable ? form.rooms : rooms).length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Rooms</p>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Price</th>
                        <th>Capacity</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(editable ? form.rooms : rooms).map((room, index) => (
                        <tr key={room._id || index}>
                          <td>
                            {editable ? (
                              <input className="admin-input" value={room.name} onChange={(e) => setRoom(index, 'name', e.target.value)} />
                            ) : (
                              room.name
                            )}
                          </td>
                          <td>{room.type || '—'}</td>
                          <td>
                            {editable ? (
                              <input
                                type="number"
                                className="admin-input"
                                value={room.basePrice}
                                onChange={(e) => setRoom(index, 'basePrice', e.target.value)}
                              />
                            ) : (
                              formatCurrency(room.basePrice)
                            )}
                          </td>
                          <td>{room.capacity ?? '—'}</td>
                          <td>{room.totalRooms ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(listing.images || []).length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Listing photos</p>
                <div className="flex flex-wrap gap-2">
                  {listing.images.map((src) => (
                    <img key={src} src={getMediaUrl(src)} alt="" className="h-20 w-28 rounded-lg object-cover" />
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-4">
            <h4 className="admin-section-title">Vendor documents</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              <Info label="Vendor" value={vendor?.name} />
              <Info label="Email" value={vendor?.email} />
              <Info label="Phone" value={vendor?.phone} />
              <Info label="KYC status" value={kyc?.status || 'Not submitted'} />
            </div>
            {!kyc ? (
              <p className="text-sm text-slate-500">No KYC documents have been submitted for this vendor yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {DOC_FIELDS.map(([label, key]) => {
                  const value = kyc[key];
                  if (!value) return null;
                  if (isFileValue(value)) {
                    const href = getMediaUrl(value);
                    const isImage = /\.(png|jpe?g|webp|gif)$/i.test(value);
                    return (
                      <div key={key}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                        {isImage ? (
                          <a href={href} target="_blank" rel="noreferrer">
                            <img src={href} alt={label} className="mt-1 h-24 w-36 rounded-lg object-cover" />
                          </a>
                        ) : (
                          <a className="mt-1 inline-block text-sm text-primary underline" href={href} target="_blank" rel="noreferrer">
                            Open document
                          </a>
                        )}
                      </div>
                    );
                  }
                  return <Info key={key} label={label} value={value} />;
                })}
                {kyc.bankDetails && (
                  <Info
                    label="Bank details"
                    value={[kyc.bankDetails.accountHolder, kyc.bankDetails.bankName, kyc.bankDetails.accountNumber, kyc.bankDetails.ifsc, kyc.bankDetails.upiId]
                      .filter(Boolean)
                      .join(' · ')}
                  />
                )}
              </div>
            )}
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-4">
            <h4 className="admin-section-title">Commission</h4>
            <p className="text-sm text-slate-600">Required to approve. Example: 10% of ₹100 = ₹10 platform commission.</p>
            <label className="admin-label max-w-xs">
              Commission % <span className="text-red-600">*</span>
              <input
                type="number"
                min="0"
                step="0.1"
                className="admin-input"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                required
              />
            </label>
            {!commissionValid && <p className="text-sm text-red-600">Enter a valid commission of 0 or more.</p>}
          </section>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" className="admin-btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="admin-btn-danger-solid" onClick={requestReject} disabled={!!acting}>
              Reject
            </button>
            <button
              type="button"
              className="admin-btn-success"
              onClick={requestApprove}
              disabled={!!acting || !commissionValid}
            >
              Approve
            </button>
          </div>
        </div>
      )}
    </AdminModal>

      <AdminModal
        open={!!confirmAction}
        stacked
        title={confirmAction === 'approve' ? 'Confirm approval' : 'Confirm rejection'}
        onClose={() => !acting && setConfirmAction(null)}
      >
        <p className="text-sm text-slate-600">
          {confirmAction === 'approve'
            ? `Are you sure you want to approve "${listing?.name || 'this listing'}"?`
            : `Are you sure you want to reject "${listing?.name || 'this listing'}"?`}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => setConfirmAction(null)}
            disabled={!!acting}
          >
            Cancel
          </button>
          {confirmAction === 'approve' ? (
            <button type="button" className="admin-btn-success" onClick={approve} disabled={!!acting}>
              {acting === 'approve' ? 'Approving…' : 'Yes, approve'}
            </button>
          ) : (
            <button type="button" className="admin-btn-danger-solid" onClick={reject} disabled={!!acting}>
              {acting === 'reject' ? 'Rejecting…' : 'Yes, reject'}
            </button>
          )}
        </div>
      </AdminModal>
    </>
  );
}
