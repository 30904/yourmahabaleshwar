import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import AdminModal from '../../components/AdminModal';
import RowActions from '../../components/RowActions';
import ListingReviewModal from '../../components/ListingReviewModal';
import {
  createHomestay,
  createHorse,
  deleteHomestay,
  deleteHorse,
} from '../../../services/enterpriseAdminApi';
import api from '../../../services/api';
import { formatCurrency } from '../../../utils/format';
import { listingStatusOf } from '../../../utils/listingStatus';

export default function HomestayHorseListPage({ kind = 'homestays' }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [review, setReview] = useState({ row: null, mode: 'view' });
  const isHorse = kind === 'horses';
  const listingType = isHorse ? 'HORSE' : 'HOMESTAY';
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
    setAddOpen(true);
  };

  const onSave = async (data) => {
    try {
      if (isHorse) {
        const price = Number(data.price);
        await createHorse({
          name: data.name,
          description: data.description,
          location: data.location,
          priceFrom: price,
          routes: [{ name: 'Standard ride', durationMinutes: 30, price }],
          isActive: true,
        });
      } else {
        const priceFrom = Number(data.priceFrom);
        await createHomestay({
          name: data.name,
          description: data.description,
          location: data.location,
          contactPhone: data.contactPhone,
          priceFrom,
          rooms: [{ name: 'Standard', basePrice: priceFrom, capacity: 2, totalRooms: 1 }],
          isActive: true,
        });
      }
      toast.success('Created');
      setAddOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
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
            { key: 'delete', label: 'Delete', onClick: () => remove(r), tone: 'danger' },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isHorse ? 'Horse Rides' : 'Homestays'}
        subtitle="Open View or Edit to review documents, set commission, and approve or reject."
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
        open={addOpen}
        title={`Add ${isHorse ? 'Horse Ride' : 'Homestay'}`}
        onClose={() => setAddOpen(false)}
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
            <button type="button" className="admin-btn-secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary">
              Save
            </button>
          </div>
        </form>
      </AdminModal>

      <ListingReviewModal
        open={!!review.row}
        mode={review.mode}
        listingType={listingType}
        listingId={review.row?._id}
        onClose={() => setReview({ row: null, mode: 'view' })}
        onChanged={load}
      />
    </div>
  );
}
