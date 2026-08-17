import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Grid, List } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import AdminModal from '../../components/AdminModal';
import RowActions, { buildMasterActions } from '../../components/RowActions';
import {
  fetchAdminProperties,
  setAdminPropertyActive,
  deleteHotel,
  deleteTent,
} from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';

export default function PropertyListPage({ typeFilter }) {
  const [hotels, setHotels] = useState([]);
  const [tents, setTents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState('table');
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

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

  const toggleActive = async (row) => {
    try {
      const next = row.isActive === false;
      await setAdminPropertyActive(row._id, {
        isActive: next,
        listingType: row.listingType === 'TENT' ? 'TENT' : row.listingType,
      });
      toast.success(next ? 'Marked active' : 'Marked inactive — still visible here, hidden on website');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Mark "${row.name}" inactive and hide it from the website?`)) return;
    try {
      // Soft-deactivate so the row stays in admin (status INACTIVE)
      await setAdminPropertyActive(row._id, {
        isActive: false,
        listingType: row.listingType === 'TENT' ? 'TENT' : row.listingType,
      });
      toast.success('Marked inactive — still listed in admin');
      load();
    } catch (e) {
      // Fallback hard delete for tents only if status API fails
      try {
        if (row.listingType === 'TENT') await deleteTent(row._id);
        else await deleteHotel(row._id);
        toast.success('Removed');
        load();
      } catch {
        toast.error(e.response?.data?.message || 'Delete failed');
      }
    }
  };

  const publicPath = (row) => {
    if (row.listingType === 'TENT') return `/tents/${row.slug}`;
    return `/hotels/${row.slug}`;
  };

  const columns = [
    {
      key: 'image',
      label: 'Property',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=120'}
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
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />,
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
          items={buildMasterActions({
            isActive: r.isActive !== false,
            onView: () => setViewing(r),
            editTo: r.listingType !== 'TENT' ? `/admin/properties/edit/${r._id}` : undefined,
            onToggleActive: () => toggleActive(r),
            onDelete: () => remove(r),
          })}
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
        subtitle="Admin sees active & inactive. Website visitors only see active listings."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: title }]}
        actions={
          <Link to="/admin/properties/new" className="admin-btn-primary">
            <Plus size={18} />
            Add Property
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
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
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

      <AdminModal open={!!viewing} title={viewing?.name || 'Property'} onClose={() => setViewing(null)}>
        {viewing && (
          <div className="space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Type:</span> {viewing.listingType}
            </p>
            <p>
              <span className="font-semibold">Price:</span>{' '}
              {formatCurrency(viewing.priceFrom || viewing.pricePerNight)}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{' '}
              {viewing.isActive !== false ? 'Active' : 'Inactive'}
            </p>
            <p className="text-slate-600">{viewing.description || '—'}</p>
            {viewing.slug && (
              <a className="text-primary underline" href={publicPath(viewing)} target="_blank" rel="noreferrer">
                Open public page
              </a>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
