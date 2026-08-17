import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import AdminModal from '../../components/AdminModal';
import RowActions, { buildMasterActions } from '../../components/RowActions';
import api from '../../../services/api';
import { formatCurrency } from '../../../utils/format';

export default function GuidePackagesPage() {
  const [rows, setRows] = useState([]);
  const [viewing, setViewing] = useState(null);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { code: '6HR', durationHours: 6, price: 1500, bikeAddonPrice: 0, isGlobal: true },
  });

  const load = () =>
    api
      .get('/admin/guide-packages')
      .then((r) => setRows(r.data.data || []))
      .catch(() => toast.error('Failed to load guide packages'));

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/admin/guide-packages', {
        ...data,
        durationHours: Number(data.durationHours),
        price: Number(data.price),
        bikeAddonPrice: Number(data.bikeAddonPrice) || 0,
        isGlobal: data.isGlobal === true || data.isGlobal === 'true',
        placesCovered: String(data.placesCovered || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      toast.success('Package created');
      reset({ code: '6HR', durationHours: 6, price: 1500, bikeAddonPrice: 0, isGlobal: true, name: '', placesCovered: '', description: '' });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Create failed');
    }
  };

  const toggleActive = async (row) => {
    try {
      await api.patch(`/admin/guide-packages/${row._id}`, { isActive: row.isActive === false });
      toast.success(row.isActive === false ? 'Marked active' : 'Marked inactive');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete package "${row.name}"?`)) return;
    try {
      await api.delete(`/admin/guide-packages/${row._id}`);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'code', label: 'Code' },
    { key: 'durationHours', label: 'Hours' },
    { key: 'price', label: 'Price (₹)', render: (r) => formatCurrency(r.price) },
    { key: 'bikeAddonPrice', label: 'Bike addon (₹)', render: (r) => formatCurrency(r.bikeAddonPrice || 0) },
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
            onView: () => setViewing(r),
            onToggleActive: () => toggleActive(r),
            onDelete: () => remove(r),
          })}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Guide Packages" subtitle="Global and guide-specific tour packages" />
      <form onSubmit={handleSubmit(onSubmit)} className="admin-card grid gap-3 p-6 sm:grid-cols-3">
        <input className="admin-input" placeholder="Name" {...register('name', { required: true })} />
        <input className="admin-input" placeholder="Code (6HR/12HR)" {...register('code', { required: true })} />
        <input type="number" className="admin-input" placeholder="Hours" {...register('durationHours')} />
        <input type="number" className="admin-input" placeholder="Price (₹)" {...register('price')} />
        <input type="number" className="admin-input" placeholder="Bike addon (₹)" {...register('bikeAddonPrice')} />
        <input className="admin-input" placeholder="Places (comma separated)" {...register('placesCovered')} />
        <input className="admin-input sm:col-span-2" placeholder="Description" {...register('description')} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('isGlobal')} defaultChecked /> Global package
        </label>
        <button type="submit" className="admin-btn-primary sm:col-span-3">
          Add package
        </button>
      </form>
      <DataTable columns={columns} data={rows} />
      <AdminModal open={!!viewing} title={viewing?.name || 'Package'} onClose={() => setViewing(null)}>
        {viewing && (
          <div className="space-y-2 text-sm text-slate-700">
            <p>{viewing.description || '—'}</p>
            <p><span className="font-semibold">Code:</span> {viewing.code}</p>
            <p><span className="font-semibold">Hours:</span> {viewing.durationHours}</p>
            <p><span className="font-semibold">Price:</span> {formatCurrency(viewing.price)}</p>
            <p><span className="font-semibold">Status:</span> {viewing.isActive !== false ? 'Active' : 'Inactive'}</p>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
