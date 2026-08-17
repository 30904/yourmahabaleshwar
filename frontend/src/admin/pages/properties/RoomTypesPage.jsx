import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import AdminModal from '../../components/AdminModal';
import RowActions, { buildMasterActions } from '../../components/RowActions';
import {
  fetchRoomTypes,
  createRoomType,
  updateRoomType,
  deleteRoomType,
} from '../../../services/enterpriseAdminApi';

export default function RoomTypesPage() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      defaultCapacity: 2,
      sortOrder: 0,
      isActive: true,
    },
  });

  const load = () =>
    fetchRoomTypes()
      .then(setItems)
      .catch(() => toast.error('Failed to load room types'));

  useEffect(() => {
    load();
  }, []);

  const startEdit = (row) => {
    setEditing(row);
    reset({
      code: row.code,
      name: row.name,
      description: row.description || '',
      defaultCapacity: row.defaultCapacity ?? 2,
      sortOrder: row.sortOrder ?? 0,
      isActive: row.isActive,
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    reset({
      code: '',
      name: '',
      description: '',
      defaultCapacity: 2,
      sortOrder: 0,
      isActive: true,
    });
  };

  const onSubmit = async (data) => {
    const payload = {
      code: data.code?.trim().toUpperCase(),
      name: data.name.trim(),
      description: data.description,
      defaultCapacity: Number(data.defaultCapacity) || 2,
      sortOrder: Number(data.sortOrder) || 0,
      isActive: data.isActive === true || data.isActive === 'true',
    };
    try {
      if (editing) {
        await updateRoomType(editing._id, payload);
        toast.success('Room type updated');
      } else {
        await createRoomType(payload);
        toast.success('Room type added');
      }
      cancelEdit();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Delete room type "${row.name}"?`)) return;
    try {
      await deleteRoomType(row._id);
      toast.success('Deleted');
      if (editing?._id === row._id) cancelEdit();
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = [
    { key: 'code', label: 'Code', render: (r) => <span className="font-mono text-sm font-bold">{r.code}</span> },
    { key: 'name', label: 'Display name', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'defaultCapacity', label: 'Default guests' },
    { key: 'sortOrder', label: 'Order' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      label: 'Action',
      render: (r) => (
        <RowActions
          items={buildMasterActions({
            isActive: !!r.isActive,
            onView: () => setViewing(r),
            onEdit: () => startEdit(r),
            onToggleActive: async () => {
              try {
                await updateRoomType(r._id, { isActive: !r.isActive });
                toast.success(r.isActive ? 'Marked inactive' : 'Marked active');
                load();
              } catch {
                toast.error('Update failed');
              }
            },
            onDelete: () => onDelete(r),
          })}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Room Types"
        subtitle="Catalog used in property room pricing step"
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Properties', to: '/admin/properties' },
          { label: 'Room Types' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="admin-card grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-6">
        <label className="admin-label">
          Code *
          <input
            className="admin-input font-mono uppercase"
            placeholder="DELUXE"
            disabled={Boolean(editing)}
            {...register('code', { required: !editing })}
          />
        </label>
        <label className="admin-label lg:col-span-2">
          Display name *
          <input className="admin-input" placeholder="Deluxe Room" {...register('name', { required: true })} />
        </label>
        <label className="admin-label lg:col-span-3">
          Description
          <input className="admin-input" placeholder="Upgraded room with premium furnishings" {...register('description')} />
        </label>
        <label className="admin-label">
          Default guests
          <input type="number" min={1} className="admin-input" {...register('defaultCapacity')} />
        </label>
        <label className="admin-label">
          Sort order
          <input type="number" className="admin-input" {...register('sortOrder')} />
        </label>
        <label className="admin-label flex items-end gap-2 pb-2">
          <input type="checkbox" {...register('isActive')} />
          <span className="text-sm font-medium">Active</span>
        </label>
        <div className="flex items-end gap-2 lg:col-span-6">
          <button type="submit" className="admin-btn-primary">
            {editing ? 'Update room type' : 'Add room type'}
          </button>
          {editing && (
            <button type="button" className="admin-btn-secondary" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <DataTable columns={columns} data={items} emptyMessage="No room types yet. Run npm run seed:catalog or add one above." />
      <AdminModal open={!!viewing} title={viewing?.name || 'Room type'} onClose={() => setViewing(null)}>
        {viewing && (
          <div className="space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold">Code:</span> {viewing.code}</p>
            <p><span className="font-semibold">Capacity:</span> {viewing.defaultCapacity}</p>
            <p><span className="font-semibold">Status:</span> {viewing.isActive ? 'Active' : 'Inactive'}</p>
            <p>{viewing.description || '—'}</p>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
