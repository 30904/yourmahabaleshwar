import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RowActions from '../../components/RowActions';
import ListingReviewModal from '../../components/ListingReviewModal';
import { fetchAdminDrivers, deleteDriver } from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';
import { listingStatusOf } from '../../../utils/listingStatus';

const COPY = {
  TAXI: {
    entity: 'Taxi listing',
    entityPlural: 'taxi listings',
    nameColumn: 'Taxi / Fleet',
    add: 'Add taxi listing',
    allTitle: 'All Taxi Listings',
    pendingTitle: 'Pending Taxi KYC',
    approvedTitle: 'Approved Taxi',
    loadError: 'Failed to load taxi listings',
    deleteConfirm: (name) => `Delete taxi listing "${name}"? This cannot be undone.`,
    deleteSuccess: 'Taxi listing deleted',
    publicPath: '/taxi',
    listingType: 'TAXI',
  },
  DRIVER: {
    entity: 'Driver',
    entityPlural: 'drivers',
    nameColumn: 'Driver',
    add: 'Add driver',
    allTitle: 'All Drivers',
    pendingTitle: 'Pending Driver KYC',
    approvedTitle: 'Approved Drivers',
    loadError: 'Failed to load drivers',
    deleteConfirm: (name) => `Delete driver "${name}"? This cannot be undone.`,
    deleteSuccess: 'Driver deleted',
    publicPath: '/drivers',
    listingType: 'DRIVER',
  },
};

export default function DriverListPage({ vendorType = 'TAXI', kycFilter }) {
  const navigate = useNavigate();
  const vt = vendorType === 'DRIVER' ? 'DRIVER' : 'TAXI';
  const copy = COPY[vt];
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({ row: null, mode: 'view' });

  const title = useMemo(() => {
    if (kycFilter === 'pending') return copy.pendingTitle;
    if (kycFilter === 'approved') return copy.approvedTitle;
    return copy.allTitle;
  }, [kycFilter, copy]);

  const load = () => {
    setLoading(true);
    fetchAdminDrivers({
      vendorType: vt,
      kycStatus: kycFilter === 'pending' ? 'PENDING' : kycFilter === 'approved' ? 'APPROVED' : undefined,
    })
      .then(setDrivers)
      .catch(() => toast.error(copy.loadError))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [kycFilter, vt]);

  const remove = async (row) => {
    if (!window.confirm(copy.deleteConfirm(row.name))) return;
    try {
      await deleteDriver(row._id);
      toast.success(copy.deleteSuccess);
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = [
    { key: 'name', label: copy.nameColumn, render: (r) => <span className="font-semibold">{r.name}</span> },
    {
      key: 'owner',
      label: 'Vendor',
      render: (r) => (
        <span className="text-slate-600">
          {r.user?.name || '—'}
          {r.user?.email ? <span className="block text-xs text-slate-400">{r.user.email}</span> : null}
        </span>
      ),
    },
    { key: 'vehicleType', label: 'Vehicle' },
    { key: 'perTripPrice', label: 'Per trip', render: (r) => formatCurrency(r.perTripPrice) },
    { key: 'hourlyRate', label: 'Hourly', render: (r) => formatCurrency(r.hourlyRate) },
    { key: 'kyc', label: 'KYC', render: (r) => <StatusBadge status={r.kyc?.status || 'NONE'} /> },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={listingStatusOf(r)} />,
    },
    {
      key: 'actions',
      label: 'Action',
      render: (r) => (
        <RowActions
          items={[
            { key: 'view', label: 'View', onClick: () => setReview({ row: r, mode: 'view' }) },
            { key: 'edit', label: 'Edit', onClick: () => setReview({ row: r, mode: 'edit' }) },
            {
              key: 'fullEdit',
              label: 'Full form',
              onClick: () => navigate(`/admin/listings/${vt}/${r._id}/edit`),
            },
            { key: 'delete', label: 'Delete', onClick: () => remove(r), tone: 'danger' },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={`Review ${copy.entityPlural}, KYC documents, commission, and approval status.`}
        actions={
          <Link to={`/admin/listings/new?type=${vt}`} className="admin-btn-primary">
            <Plus size={18} /> {copy.add}
          </Link>
        }
      />

      {loading ? (
        <div className="admin-card p-12 text-center">Loading...</div>
      ) : (
        <DataTable columns={columns} data={drivers} />
      )}

      <ListingReviewModal
        open={!!review.row}
        mode={review.mode}
        listingType={copy.listingType}
        listingId={review.row?._id}
        onClose={() => setReview({ row: null, mode: 'view' })}
        onChanged={load}
      />
    </div>
  );
}
