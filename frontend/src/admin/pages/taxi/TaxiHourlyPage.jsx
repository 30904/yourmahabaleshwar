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

export default function TaxiHourlyPage() {
  const [rows, setRows] = useState([]);
  const [viewing, setViewing] = useState(null);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { vehicleType: 'ANY', minHours: 4, hourlyRate: 400 },
  });

  const load = () =>
    api
      .get('/admin/taxi-hourly-packages')
      .then((r) => setRows(r.data.data || []))
      .catch(() => toast.error('Failed to load hourly packages'));

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/admin/taxi-hourly-packages', {
        ...data,
        minHours: Number(data.minHours),
        hourlyRate: Number(data.hourlyRate),
      });
      toast.success('Hourly package created');
      reset({ vehicleType: 'ANY', minHours: 4, hourlyRate: 400, name: '', description: '' });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Create failed');
    }
  };

  const toggle = async (row) => {
    try {
      await api.patch(`/admin/taxi-hourly-packages/${row._id}`, { isActive: row.isActive === false });
      toast.success(row.isActive === false ? 'Marked active' : 'Marked inactive');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Mark "${row.name}" inactive?`)) return;
    try {
      await api.patch(`/admin/taxi-hourly-packages/${row._id}`, { isActive: false });
      toast.success('Marked inactive');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'vehicleType', label: 'Vehicle' },
    { key: 'minHours', label: 'Min hours' },
    { key: 'hourlyRate', label: 'Rate/hr (₹)', render: (r) => formatCurrency(r.hourlyRate) },
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
            onToggleActive: () => toggle(r),
            onDelete: () => remove(r),
            deleteLabel: 'Delete',
          })}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Hourly Taxi Services" subtitle="Package rates for hourly taxi bookings" />
      <form onSubmit={handleSubmit(onSubmit)} className="admin-card grid gap-3 p-6 sm:grid-cols-3">
        <input className="admin-input" placeholder="Name" {...register('name', { required: true })} />
        <select className="admin-input" {...register('vehicleType')}>
          {['ANY', 'SEDAN', 'SUV', 'INNOVA', 'TEMPO'].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <input type="number" className="admin-input" placeholder="Min hours" {...register('minHours')} />
        <input type="number" className="admin-input" placeholder="Hourly rate (₹)" {...register('hourlyRate')} />
        <input className="admin-input sm:col-span-2" placeholder="Description" {...register('description')} />
        <button type="submit" className="admin-btn-primary sm:col-span-3">
          Add hourly package
        </button>
      </form>
      <DataTable columns={columns} data={rows} />
      <AdminModal open={!!viewing} title={viewing?.name || 'Package'} onClose={() => setViewing(null)}>
        {viewing && (
          <div className="space-y-2 text-sm text-slate-700">
            <p>{viewing.description || '—'}</p>
            <p><span className="font-semibold">Vehicle:</span> {viewing.vehicleType}</p>
            <p><span className="font-semibold">Min hours:</span> {viewing.minHours}</p>
            <p><span className="font-semibold">Rate:</span> {formatCurrency(viewing.hourlyRate)}/hr</p>
            <p><span className="font-semibold">Status:</span> {viewing.isActive !== false ? 'Active' : 'Inactive'}</p>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
