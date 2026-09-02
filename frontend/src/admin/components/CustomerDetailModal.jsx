import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AdminModal from './AdminModal';
import StatusBadge from './StatusBadge';
import DocumentThumb from './DocumentThumb';
import { fetchAdminCustomerDetail } from '../../services/enterpriseAdminApi';
import { formatCurrency } from '../../utils/format';
import { getMediaUrl } from '../../utils/mediaUrl';

function Info({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{String(value)}</p>
    </div>
  );
}

function formatAddress(address) {
  if (!address) return '';
  return [address.line1, address.line2, address.city, address.state, address.pincode].filter(Boolean).join(', ');
}

export default function CustomerDetailModal({ open, customerId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !customerId) return undefined;
    let cancelled = false;
    setLoading(true);
    fetchAdminCustomerDetail(customerId)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load customer details');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, customerId]);

  const customer = data?.customer;
  const stats = data?.stats || {};
  const bookings = data?.bookings || [];
  const documents = data?.documents || [];
  const enquiries = data?.enquiries || [];

  return (
    <AdminModal
      open={open}
      title={customer ? customer.name : 'Customer details'}
      onClose={onClose}
      xl
    >
      {loading && <p className="py-8 text-center text-sm text-slate-500">Loading customer profile…</p>}

      {!loading && customer && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              {customer.avatar ? (
                <img
                  src={getMediaUrl(customer.avatar)}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-primary">
                  {customer.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <h4 className="text-lg font-bold text-slate-900">{customer.name}</h4>
                <p className="text-sm text-slate-500">{customer.email}</p>
                {customer.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}
              </div>
            </div>
            <StatusBadge status={customer.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="admin-card p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.bookingsCount ?? 0}</p>
              <p className="text-xs text-slate-500">Total bookings</p>
            </div>
            <div className="admin-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalSpent || 0)}</p>
              <p className="text-xs text-slate-500">Total spent (paid)</p>
            </div>
            <div className="admin-card p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.reviewsCount ?? 0}</p>
              <p className="text-xs text-slate-500">Reviews written</p>
            </div>
          </div>

          <section>
            <h5 className="mb-3 text-sm font-bold text-slate-900">Profile</h5>
            <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2">
              <Info label="Joined" value={new Date(customer.createdAt).toLocaleString()} />
              <Info label="Preferred language" value={customer.preferredLanguage === 'mr' ? 'Marathi' : 'English'} />
              <Info label="Email verified" value={customer.isEmailVerified ? 'Yes' : 'No'} />
              <Info label="Phone verified" value={customer.isPhoneVerified ? 'Yes' : 'No'} />
              <Info label="Wallet balance" value={formatCurrency(customer.walletBalance || 0)} />
              {formatAddress(customer.address) && (
                <div className="sm:col-span-2">
                  <Info label="Address" value={formatAddress(customer.address)} />
                </div>
              )}
            </div>
          </section>

          <section>
            <h5 className="mb-3 text-sm font-bold text-slate-900">Uploaded documents</h5>
            <p className="mb-3 text-xs text-slate-500">
              ID proofs from stay bookings and profile photo. Click to open full size.
            </p>
            {documents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No documents uploaded yet.
              </p>
            ) : (
              <div className="document-thumb-grid">
                {documents.map((doc) => (
                  <div key={doc.id} className="space-y-1">
                    <DocumentThumb label={doc.label} url={doc.url} />
                    {(doc.idType || doc.idNumber) && (
                      <p className="px-1 text-[0.65rem] text-slate-500">
                        {doc.idType}
                        {doc.idNumber ? ` · ${doc.idNumber}` : ''}
                        {doc.nationality ? ` · ${doc.nationality}` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="customer-detail-bookings-section">
            <h5 className="mb-3 text-sm font-bold text-slate-900">Bookings ({bookings.length})</h5>
            {bookings.length === 0 ? (
              <p className="text-sm text-slate-500">No bookings yet.</p>
            ) : (
              <div className="customer-detail-bookings-scroll">
                <div className="space-y-3 pr-1">
                  {bookings.map((b) => {
                  const lead = b.guestRegistration?.leadGuest;
                  const idProof = b.guestRegistration?.idProof;
                  return (
                    <div key={b._id} className="rounded-xl border border-slate-100 p-4 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {b.bookingNumber || '—'} · {b.listingName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {b.type} · {new Date(b.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={b.status} />
                          <StatusBadge status={b.paymentStatus} />
                        </div>
                      </div>
                      <p className="mt-2 font-medium text-primary">{formatCurrency(b.total)}</p>
                      {lead?.fullName && (
                        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                          <p className="font-semibold text-slate-800">Guest registration</p>
                          <p className="mt-1">
                            {lead.fullName}
                            {lead.mobile ? ` · ${lead.mobile}` : ''}
                            {lead.email ? ` · ${lead.email}` : ''}
                          </p>
                          {lead.address && <p className="mt-0.5">{lead.address}</p>}
                          {idProof?.type && (
                            <p className="mt-1">
                              ID: {idProof.type}
                              {idProof.number ? ` · ${idProof.number}` : ''}
                              {idProof.nationality ? ` · ${idProof.nationality}` : ''}
                              {idProof.documentUrl && (
                                <>
                                  {' · '}
                                  <a
                                    href={getMediaUrl(idProof.documentUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline"
                                  >
                                    View document
                                  </a>
                                </>
                              )}
                            </p>
                          )}
                          {b.guestRegistration?.coTravellers?.length > 0 && (
                            <p className="mt-1">
                              Co-travellers:{' '}
                              {b.guestRegistration.coTravellers.map((c) => c.fullName).filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </section>

          {enquiries.length > 0 && (
            <section>
              <h5 className="mb-3 text-sm font-bold text-slate-900">Enquiries ({enquiries.length})</h5>
              <div className="space-y-2">
                {enquiries.map((e) => (
                  <div key={e._id} className="rounded-lg border border-slate-100 p-3 text-sm">
                    <p className="font-medium text-slate-800">{e.type} · {e.status}</p>
                    <p className="mt-1 text-slate-600">{e.message || '—'}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(e.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AdminModal>
  );
}
