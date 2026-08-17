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
  fetchAdminDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';

const VEHICLES = ['SEDAN', 'SUV', 'TEMPO', 'INNOVA', 'BIKE'];
const emptyForm = {
  name: '',
  phone: '',
  vehicleType: 'SEDAN',
  vehicleNumber: '',
  perTripPrice: 1500,
  hourlyRate: 400,
};

export default function DriverListPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ mode: null, row: null });
  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyForm });

  const load = () => {
    setLoading(true);
    fetchAdminDrivers()
      .then(setDrivers)
      .catch(() => toast.error('Failed to load drivers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    reset(emptyForm);
    setModal({ mode: 'add', row: null });
  };

  const openEdit = (row) => {
    reset({
      name: row.name || '',
      phone: row.phone || '',
      vehicleType: row.vehicleType || 'SEDAN',
      vehicleNumber: row.vehicleNumber || '',
      perTripPrice: row.perTripPrice || 0,
      hourlyRate: row.hourlyRate || 0,
    });
    setModal({ mode: 'edit', row });
  };

  const openView = (row) => setModal({ mode: 'view', row });

  const onSave = async (data) => {
    const payload = {
      ...data,
      perTripPrice: Number(data.perTripPrice),
      hourlyRate: Number(data.hourlyRate),
      isActive: true,
    };
    try {
      if (modal.mode === 'edit' && modal.row) {
        await updateDriver(modal.row._id, payload);
        toast.success('Driver updated');
      } else {
        await createDriver(payload);
        toast.success('Driver added');
      }
      setModal({ mode: null, row: null });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const toggleActive = async (row) => {
    try {
      await updateDriver(row._id, { isActive: row.isActive === false });
      toast.success(row.isActive === false ? 'Marked active' : 'Marked inactive');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete driver "${row.name}"? This cannot be undone.`)) return;
    try {
      await deleteDriver(row._id);
      toast.success('Driver deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Driver', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'vehicleType', label: 'Vehicle' },
    { key: 'perTripPrice', label: 'Per trip', render: (r) => formatCurrency(r.perTripPrice) },
    { key: 'hourlyRate', label: 'Hourly', render: (r) => formatCurrency(r.hourlyRate) },
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
            onView: () => openView(r),
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
        title="Taxi Drivers"
        subtitle="Vehicle fleet & driver management"
        actions={
          <button type="button" className="admin-btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add Driver
          </button>
        }
      />
      {loading ? (
        <div className="admin-card p-12 text-center">Loading...</div>
      ) : (
        <DataTable columns={columns} data={drivers} />
      )}

      <AdminModal
        open={modal.mode === 'add' || modal.mode === 'edit'}
        title={modal.mode === 'edit' ? 'Edit Driver' : 'Add Driver'}
        onClose={() => setModal({ mode: null, row: null })}
      >
        <form onSubmit={handleSubmit(onSave)} className="grid gap-3 sm:grid-cols-2">
          <input className="admin-input" placeholder="Name" {...register('name', { required: true })} />
          <input className="admin-input" placeholder="Phone" {...register('phone')} />
          <select className="admin-input" {...register('vehicleType')}>
            {VEHICLES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <input className="admin-input" placeholder="Vehicle number" {...register('vehicleNumber')} />
          <input type="number" className="admin-input" placeholder="Per trip (₹)" {...register('perTripPrice')} />
          <input type="number" className="admin-input" placeholder="Hourly (₹)" {...register('hourlyRate')} />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="admin-btn-secondary" onClick={() => setModal({ mode: null, row: null })}>
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary">Save</button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={!!viewing}
        title={viewing?.name || 'Driver'}
        onClose={() => setModal({ mode: null, row: null })}
      >
        {viewing && (
          <div className="space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold">Vehicle:</span> {viewing.vehicleType} {viewing.vehicleNumber || ''}</p>
            <p><span className="font-semibold">Phone:</span> {viewing.phone || '—'}</p>
            <p><span className="font-semibold">Per trip:</span> {formatCurrency(viewing.perTripPrice)}</p>
            <p><span className="font-semibold">Hourly:</span> {formatCurrency(viewing.hourlyRate)}</p>
            <p><span className="font-semibold">Status:</span> {viewing.isActive !== false ? 'Active' : 'Inactive'}</p>
            {viewing.slug && (
              <a className="text-primary underline" href={`/taxi/${viewing.slug}`} target="_blank" rel="noreferrer">
                Open public page
              </a>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
