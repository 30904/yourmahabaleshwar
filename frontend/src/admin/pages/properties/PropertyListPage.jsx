import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Grid, List } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RowActions from '../../components/RowActions';
import ListingReviewModal from '../../components/ListingReviewModal';
import {
  fetchAdminProperties,
  setAdminPropertyActive,
  deleteHotel,
  deleteTent,
} from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';
import { listingCoverImage } from '../../../utils/mediaUrl';
import { listingStatusOf } from '../../../utils/listingStatus';

export default function PropertyListPage({ typeFilter }) {
  const [hotels, setHotels] = useState([]);
  const [tents, setTents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState('table');
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({ row: null, mode: 'view' });

  const load = () => {
    setLoading(true);
    const type =
      typeFilter === 'hotels' ? 'HOTEL' : typeFilter === 'resorts' ? 'RESORT' : typeFilter === 'tents' ? 'TENT' : undefined;
    fetchAdminProperties({
      search,
      type: type === 'TENT' ? undefined : type,
      status: statusFilter,
    })
      .then((d) => {
        setHotels(type === 'TENT' ? [] : d.hotels || []);
        setTents(type === 'TENT' || !type ? d.tents || [] : []);
      })
      .catch(() => toast.error('Failed to load properties'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [typeFilter, search, statusFilter]);

  const rows = [
    ...hotels.map((h) => ({ ...h, listingType: h.type })),
    ...tents.map((t) => ({ ...t, listingType: 'TENT', priceFrom: t.pricePerNight })),
  ].sort(
    (a, b) =>
      Number(b.isActive === false) - Number(a.isActive === false) ||
      String(a.name || '').localeCompare(String(b.name || ''))
  );

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.name}"? This hides it from the website.`)) return;
    try {
      if (row.listingType === 'TENT') await deleteTent(row._id);
      else await deleteHotel(row._id);
      toast.success('Listing deleted');
      load();
    } catch (e) {
      try {
        await setAdminPropertyActive(row._id, {
          isActive: false,
          listingType: row.listingType === 'TENT' ? 'TENT' : row.listingType,
        });
        toast.success('Listing removed from the website');
        load();
      } catch {
        toast.error(e.response?.data?.message || 'Delete failed');
      }
    }
  };

  const columns = [
    {
      key: 'image',
      label: 'Property',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={listingCoverImage(row) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=120'}
            alt=""
            className="h-12 w-16 rounded-lg object-cover"
          />
          <div>
            <p className="font-semibold text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.address?.city || row.location}</p>
          </div>
        </div>
      ),
    },
    { key: 'listingType', label: 'Type' },
    {
      key: 'vendor',
      label: 'Vendor',
      render: (r) => r.vendor?.name || r.operator?.name || '—',
    },
    {
      key: 'price',
      label: 'Price',
      render: (r) => formatCurrency(r.priceFrom || r.pricePerNight),
    },
    ...(typeFilter !== 'tents'
      ? [
          {
            key: 'renewalPrice',
            label: 'Sub. renewal',
            render: (r) =>
              r.listingType === 'TENT' ? '—' : r.renewalPrice != null ? formatCurrency(r.renewalPrice) : 'Not set',
          },
        ]
      : []),
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={listingStatusOf(r)} />,
    },
    {
      key: 'featured',
      label: 'Featured',
      render: (r) => (r.isFeatured ? 'Yes' : '—'),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (r) => (
        <RowActions
          items={[
            { key: 'view', label: 'View', onClick: () => setReview({ row: r, mode: 'view' }) },
            { key: 'edit', label: 'Edit', onClick: () => setReview({ row: r, mode: 'edit' }) },
            { key: 'delete', label: 'Delete', onClick: () => remove(r), tone: 'danger' },
          ]}
        />
      ),
    },
  ];

  const title =
    typeFilter === 'hotels'
      ? 'Hotels'
      : typeFilter === 'resorts'
        ? 'Resorts'
        : typeFilter === 'tents'
          ? 'Tents'
          : 'All Properties';

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle="Open View or Edit to review documents, set commission, and approve or reject."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: title }]}
        actions={
          <Link to="/admin/listings/new?type=HOTEL" className="admin-btn-primary">
            <Plus size={18} />
            Add Listing
          </Link>
        }
      />

      <div className="admin-card flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties..."
            className="admin-input pl-10"
          />
        </div>
        <select
          className="admin-input w-auto min-w-[140px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="approved">Approved only</option>
          <option value="pending">Pending only</option>
          <option value="rejected">Rejected only</option>
        </select>
        <div className="flex gap-1 rounded-lg border border-slate-200 p-1">
          <button
            type="button"
            onClick={() => setView('table')}
            className={`rounded-md p-2 ${view === 'table' ? 'bg-blue-50 text-primary' : ''}`}
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => setView('grid')}
            className={`rounded-md p-2 ${view === 'grid' ? 'bg-blue-50 text-primary' : ''}`}
          >
            <Grid size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-card p-12 text-center text-slate-500">Loading...</div>
      ) : (
        <DataTable columns={columns} data={rows} emptyMessage="No properties found" />
      )}

      <ListingReviewModal
        open={!!review.row}
        mode={review.mode}
        listingType={review.row?.listingType}
        listingId={review.row?._id}
        onClose={() => setReview({ row: null, mode: 'view' })}
        onChanged={load}
      />
    </div>
  );
}
