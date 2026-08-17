import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import AdminModal from '../../components/AdminModal';
import RowActions, { buildMasterActions } from '../../components/RowActions';
import {
  createHomestay,
  updateHomestay,
  deleteHomestay,
  createHorse,
  updateHorse,
  deleteHorse,
} from '../../../services/enterpriseAdminApi';
import api from '../../../services/api';
import { formatCurrency } from '../../../utils/format';

export default function HomestayHorseListPage({ kind = 'homestays' }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ mode: null, row: null });
  const isHorse = kind === 'horses';
  const { register, handleSubmit, reset } = useForm({
    defaultValues: isHorse
      ? { name: '', description: '', price: 800, location: 'Mahabaleshwar' }
      : { name: '', description: '', priceFrom: 2000, location: 'Mahabaleshwar', contactPhone: '' },
  });

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

  const openAdd = () => {
    reset(
      isHorse
        ? { name: '', description: '', price: 800, location: 'Mahabaleshwar' }
        : { name: '', description: '', priceFrom: 2000, location: 'Mahabaleshwar', contactPhone: '' }
    );
    setModal({ mode: 'add', row: null });
  };

  const openEdit = (row) => {
    if (isHorse) {
      reset({
        name: row.name || '',
        description: row.description || '',
        price: row.priceFrom || row.routes?.[0]?.price || 0,
        location: row.location || 'Mahabaleshwar',
      });
    } else {
      reset({
        name: row.name || '',
        description: row.description || '',
        priceFrom: row.priceFrom || 0,
        location: row.location || row.address?.city || 'Mahabaleshwar',
        contactPhone: row.contactPhone || '',
      });
    }
    setModal({ mode: 'edit', row });
  };

  const onSave = async (data) => {
    try {
      if (isHorse) {
        const price = Number(data.price);
        const payload = {
          name: data.name,
          description: data.description,
          location: data.location,
          priceFrom: price,
          routes: [{ name: 'Standard ride', durationMinutes: 30, price }],
          isActive: true,
        };
        if (modal.mode === 'edit' && modal.row) await updateHorse(modal.row._id, payload);
        else await createHorse(payload);
      } else {
        const priceFrom = Number(data.priceFrom);
        const payload = {
          name: data.name,
          description: data.description,
          location: data.location,
          contactPhone: data.contactPhone,
          priceFrom,
          rooms: [{ name: 'Standard', basePrice: priceFrom, capacity: 2, totalRooms: 1 }],
          isActive: true,
        };
        if (modal.mode === 'edit' && modal.row) await updateHomestay(modal.row._id, payload);
        else await createHomestay(payload);
      }
      toast.success(modal.mode === 'edit' ? 'Updated' : 'Created');
      setModal({ mode: null, row: null });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const toggleActive = async (row) => {
    try {
      const next = row.isActive === false;
      if (isHorse) await updateHorse(row._id, { isActive: next });
      else await updateHomestay(row._id, { isActive: next });
      toast.success(next ? 'Marked active' : 'Marked inactive');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

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

  const publicPath = isHorse ? 'horses' : 'homestays';

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
    {
      key: 'location',
      label: 'Location',
      render: (r) => r.address?.city || r.location || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      label: 'Action',
      render: (r) => (
        <RowActions
          items={buildMasterActions({
            isActive: r.isActive !== false,
            onView: () => setModal({ mode: 'view', row: r }),
            onEdit: () => openEdit(r),
            onToggleActive: () => toggleActive(r),
            onDelete: () => remove(r),
          })}
        />
      ),
    },
  ];

  const viewing = modal.mode === 'view' ? modal.row : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isHorse ? 'Horse Rides' : 'Homestays'}
        subtitle={isHorse ? 'Horse operators and rides' : 'Homestay listings'}
        actions={
          <button type="button" className="admin-btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add {isHorse ? 'Horse Ride' : 'Homestay'}
          </button>
        }
      />
      {loading ? (
        <div className="admin-card p-12 text-center">Loading...</div>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

      <AdminModal
        open={modal.mode === 'add' || modal.mode === 'edit'}
        title={`${modal.mode === 'edit' ? 'Edit' : 'Add'} ${isHorse ? 'Horse Ride' : 'Homestay'}`}
        onClose={() => setModal({ mode: null, row: null })}
      >
        <form onSubmit={handleSubmit(onSave)} className="grid gap-3">
          <input className="admin-input" placeholder="Name" {...register('name', { required: true })} />
          <input className="admin-input" placeholder="Description" {...register('description')} />
          <input className="admin-input" placeholder="Location" {...register('location')} />
          {isHorse ? (
            <input type="number" className="admin-input" placeholder="Price (₹)" {...register('price')} />
          ) : (
            <>
              <input type="number" className="admin-input" placeholder="From price (₹)" {...register('priceFrom')} />
              <input className="admin-input" placeholder="Contact phone" {...register('contactPhone')} />
            </>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="admin-btn-secondary" onClick={() => setModal({ mode: null, row: null })}>
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary">Save</button>
          </div>
        </form>
      </AdminModal>

      <AdminModal open={!!viewing} title={viewing?.name || 'Details'} onClose={() => setModal({ mode: null, row: null })}>
        {viewing && (
          <div className="space-y-2 text-sm text-slate-700">
            <p>{viewing.description || '—'}</p>
            <p>
              <span className="font-semibold">Price:</span>{' '}
              {formatCurrency(viewing.priceFrom || viewing.routes?.[0]?.price || 0)}
            </p>
            <p><span className="font-semibold">Status:</span> {viewing.isActive !== false ? 'Active' : 'Inactive'}</p>
            {viewing.slug && (
              <a className="text-primary underline" href={`/${publicPath}/${viewing.slug}`} target="_blank" rel="noreferrer">
                Open public page
              </a>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
