import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RowActions from '../../components/RowActions';
import ListingReviewModal from '../../components/ListingReviewModal';
import { deleteHomestay, deleteHorse } from '../../../services/enterpriseAdminApi';
import api from '../../../services/api';
import { formatCurrency } from '../../../utils/format';
import { listingStatusOf } from '../../../utils/listingStatus';

export default function HomestayHorseListPage({ kind = 'homestays' }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({ row: null, mode: 'view' });
  const isHorse = kind === 'horses';
  const listingType = isHorse ? 'HORSE' : 'HOMESTAY';

  const load = () => {
    setLoading(true);
    const path = isHorse ? '/admin/enterprise/horses' : '/admin/enterprise/homestays';
    api
      .get(path)
      .then((r) => setRows(r.data.data || []))
      .catch(() => toast.error(`Failed to load ${kind}`))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [kind, isHorse]);

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    try {
      if (isHorse) await deleteHorse(row._id);
      else await deleteHomestay(row._id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = [
    {
      key: 'name',
      label: isHorse ? 'Ride / Operator' : 'Homestay',
      render: (r) => (
        <div>
          <p className="font-semibold">{r.name}</p>
          <p className="text-xs text-slate-500">{r.slug}</p>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (r) => formatCurrency(r.priceFrom || r.pricePerRide || r.price || r.routes?.[0]?.price || 0),
    },
    ...(!isHorse
      ? [
          {
            key: 'renewalPrice',
            label: 'Sub. renewal',
            render: (r) => (r.renewalPrice != null ? formatCurrency(r.renewalPrice) : 'Not set'),
          },
        ]
      : []),
    {
      key: 'location',
      label: 'Location',
      render: (r) => r.address?.city || r.location || '—',
    },
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
              onClick: () => navigate(`/admin/listings/${listingType}/${r._id}/edit`),
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
        title={isHorse ? 'Horse Rides' : 'Homestays'}
        subtitle="Open View or Edit to review documents, set commission, and approve or reject."
        actions={
          <Link to={`/admin/listings/new?type=${listingType}`} className="admin-btn-primary">
            <Plus size={18} /> Add {isHorse ? 'Horse Ride' : 'Homestay'}
          </Link>
        }
      />
      {loading ? (
        <div className="admin-card p-12 text-center">Loading...</div>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

      <ListingReviewModal
        open={!!review.row}
        mode={review.mode}
        listingType={listingType}
        listingId={review.row?._id}
        onClose={() => setReview({ row: null, mode: 'view' })}
        onChanged={load}
      />
    </div>
  );
}
