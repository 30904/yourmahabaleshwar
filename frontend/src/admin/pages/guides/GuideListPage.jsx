import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RowActions from '../../components/RowActions';
import ListingReviewModal from '../../components/ListingReviewModal';
import { fetchAdminGuides, deleteGuide } from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';
import { listingStatusOf } from '../../../utils/listingStatus';

export default function GuideListPage({ kycFilter }) {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({ row: null, mode: 'view' });

  const load = () => {
    setLoading(true);
    fetchAdminGuides({
      kycStatus: kycFilter === 'pending' ? 'PENDING' : kycFilter === 'approved' ? 'APPROVED' : undefined,
    })
      .then(setGuides)
      .catch(() => toast.error('Failed to load guides'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [kycFilter]);

  const remove = async (row) => {
    if (!window.confirm(`Delete guide "${row.name}"? This cannot be undone.`)) return;
    try {
      await deleteGuide(row._id);
      toast.success('Guide deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Guide',
      render: (r) => (
        <div>
          <p className="font-semibold">{r.name}</p>
          <p className="text-xs text-slate-500">{r.slug}</p>
        </div>
      ),
    },
    { key: 'languages', label: 'Languages', render: (r) => r.languages?.join(', ') },
    { key: 'package6hr', label: '6hr', render: (r) => formatCurrency(r.package6hr) },
    { key: 'package12hr', label: '12hr', render: (r) => formatCurrency(r.package12hr) },
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
              onClick: () => navigate(`/admin/listings/GUIDE/${r._id}/edit`),
            },
            { key: 'delete', label: 'Delete', onClick: () => remove(r), tone: 'danger' },
          ]}
        />
      ),
    },
  ];

  const title = kycFilter === 'pending' ? 'Pending KYC' : kycFilter === 'approved' ? 'Approved Guides' : 'All Guides';

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle="Open View or Edit to review documents, set commission, and approve or reject."
        actions={
          !kycFilter ? (
            <Link to="/admin/listings/new?type=GUIDE" className="admin-btn-primary">
              <Plus size={18} /> Add Guide
            </Link>
          ) : null
        }
      />
      {loading ? (
        <div className="admin-card p-12 text-center">Loading...</div>
      ) : (
        <DataTable columns={columns} data={guides} />
      )}

      <ListingReviewModal
        open={!!review.row}
        mode={review.mode}
        listingType="GUIDE"
        listingId={review.row?._id}
        onClose={() => setReview({ row: null, mode: 'view' })}
        onChanged={load}
      />
    </div>
  );
}
