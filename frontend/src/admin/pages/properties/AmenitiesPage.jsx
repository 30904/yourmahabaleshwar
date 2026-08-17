import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import AdminModal from '../../components/AdminModal';
import RowActions, { buildMasterActions } from '../../components/RowActions';
import { getAmenityIcon, AMENITY_ICON_OPTIONS } from '../../utils/amenityIcons';
import {
  fetchAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
} from '../../../services/enterpriseAdminApi';

const CATEGORIES = ['GENERAL', 'ROOM', 'WELLNESS', 'OUTDOOR', 'DINING', 'SERVICES'];

export default function AmenitiesPage() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { icon: 'Sparkles', category: 'GENERAL', sortOrder: 0, isActive: true },
  });

  const load = () =>
    fetchAmenities()
      .then(setItems)
      .catch(() => toast.error('Failed to load amenities'));

  useEffect(() => {
    load();
  }, []);

  const startEdit = (row) => {
    setEditing(row);
    reset({
      name: row.name,
      icon: row.icon || 'Sparkles',
      category: row.category || 'GENERAL',
      sortOrder: row.sortOrder ?? 0,
      isActive: row.isActive,
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    reset({ name: '', icon: 'Sparkles', category: 'GENERAL', sortOrder: 0, isActive: true });
  };

  const onSubmit = async (data) => {
    const payload = {
      name: data.name.trim(),
      icon: data.icon,
      category: data.category,
      sortOrder: Number(data.sortOrder) || 0,
      isActive: data.isActive === true || data.isActive === 'true',
    };
    try {
      if (editing) {
        await updateAmenity(editing._id, payload);
        toast.success('Amenity updated');
      } else {
        await createAmenity(payload);
        toast.success('Amenity added');
      }
      cancelEdit();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    try {
      await deleteAmenity(row._id);
      toast.success('Deleted');
      if (editing?._id === row._id) cancelEdit();
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleActive = async (row) => {
    try {
      await updateAmenity(row._id, { isActive: !row.isActive });
      toast.success(row.isActive ? 'Marked inactive' : 'Marked active');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const columns = [
    {
      key: 'icon',
      label: '',
      render: (r) => {
        const Icon = getAmenityIcon(r.icon);
        return (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-primary">
            <Icon size={18} />
          </span>
        );
      },
    },
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'category', label: 'Category' },
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
            onToggleActive: () => toggleActive(r),
            onDelete: () => onDelete(r),
          })}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Amenities"
        subtitle="Master list used when adding or editing properties"
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Properties', to: '/admin/properties' },
          { label: 'Amenities' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="admin-card grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-6">
        <label className="admin-label lg:col-span-2">
          Name *
          <input className="admin-input" placeholder="e.g. Free WiFi" {...register('name', { required: true })} />
        </label>
        <label className="admin-label">
          Icon
          <select className="admin-input" {...register('icon')}>
            {AMENITY_ICON_OPTIONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-label">
          Category
          <select className="admin-input" {...register('category')}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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
            {editing ? 'Update amenity' : 'Add amenity'}
          </button>
          {editing && (
            <button type="button" className="admin-btn-secondary" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <DataTable columns={columns} data={items} emptyMessage="No amenities yet. Run npm run seed:catalog or add one above." />
      <AdminModal open={!!viewing} title={viewing?.name || 'Amenity'} onClose={() => setViewing(null)}>
        {viewing && (
          <div className="space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold">Category:</span> {viewing.category}</p>
            <p><span className="font-semibold">Icon:</span> {viewing.icon}</p>
            <p><span className="font-semibold">Status:</span> {viewing.isActive ? 'Active' : 'Inactive'}</p>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
