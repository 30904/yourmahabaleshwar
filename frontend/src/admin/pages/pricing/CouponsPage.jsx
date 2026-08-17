import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import AdminModal from '../../components/AdminModal';
import RowActions, { buildMasterActions } from '../../components/RowActions';
import { fetchCoupons, createCoupon, updateCoupon } from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { discountType: 'PERCENT', discountValue: 10 },
  });

  const load = () => fetchCoupons().then(setCoupons).catch(() => toast.error('Failed to load coupons'));
  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        discountValue: Number(data.discountValue),
        code: data.code.toUpperCase(),
        isActive: true,
      };
      if (editing) {
        await updateCoupon(editing._id, payload);
        toast.success('Coupon updated');
        setEditing(null);
      } else {
        await createCoupon(payload);
        toast.success('Coupon created');
      }
      reset({ discountType: 'PERCENT', discountValue: 10, code: '', title: '' });
      load();
    } catch {
      toast.error('Save failed');
    }
  };

  const startEdit = (row) => {
    setEditing(row);
    reset({
      code: row.code,
      title: row.title,
      discountType: row.discountType || 'PERCENT',
      discountValue: row.discountValue,
    });
  };

  const toggleActive = async (row) => {
    try {
      await updateCoupon(row._id, { isActive: !row.isActive });
      toast.success(row.isActive ? 'Marked inactive' : 'Marked active');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Deactivate & hide coupon "${row.code}"?`)) return;
    try {
      await updateCoupon(row._id, { isActive: false });
      toast.success('Coupon deactivated');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = [
    { key: 'code', label: 'Code', render: (r) => <span className="font-mono font-bold">{r.code}</span> },
    { key: 'title', label: 'Title' },
    {
      key: 'discount',
      label: 'Discount',
      render: (r) =>
        r.discountType === 'PERCENT' ? `${r.discountValue}%` : formatCurrency(r.discountValue),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
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
            onDelete: () => remove(r),
            deleteLabel: 'Delete',
          })}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons & Offers" subtitle="Promo codes and flash offers" />
      <form onSubmit={handleSubmit(onSubmit)} className="admin-card grid gap-4 p-6 sm:grid-cols-5">
        <input className="admin-input" placeholder="Code" {...register('code', { required: true })} />
        <input className="admin-input" placeholder="Title" {...register('title', { required: true })} />
        <select className="admin-input" {...register('discountType')}>
          <option value="PERCENT">Percent %</option>
          <option value="FLAT">Flat ₹</option>
        </select>
        <input type="number" className="admin-input" placeholder="Value" {...register('discountValue')} />
        <div className="flex gap-2">
          <button type="submit" className="admin-btn-primary flex-1">
            {editing ? 'Update' : 'Add Coupon'}
          </button>
          {editing && (
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => {
                setEditing(null);
                reset({ discountType: 'PERCENT', discountValue: 10, code: '', title: '' });
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <DataTable columns={columns} data={coupons} />

      <AdminModal open={!!viewing} title={viewing?.code || 'Coupon'} onClose={() => setViewing(null)}>
        {viewing && (
          <div className="space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Title:</span> {viewing.title}
            </p>
            <p>
              <span className="font-semibold">Discount:</span>{' '}
              {viewing.discountType === 'PERCENT'
                ? `${viewing.discountValue}%`
                : formatCurrency(viewing.discountValue)}
            </p>
            <p>
              <span className="font-semibold">Status:</span> {viewing.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
