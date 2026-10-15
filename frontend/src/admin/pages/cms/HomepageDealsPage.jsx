import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RowActions, { buildMasterActions } from '../../components/RowActions';
import {
  fetchHomepageDeals,
  createHomepageDeal,
  updateHomepageDeal,
  deleteHomepageDeal,
} from '../../../services/enterpriseAdminApi';

const LINKS = [
  ['/hotels', 'Hotels'],
  ['/resorts', 'Resorts'],
  ['/homestays', 'Homestays / Villas'],
  ['/tents', 'Tents'],
  ['/guides', 'Guides'],
  ['/taxi', 'Taxi'],
  ['/drivers', 'Drivers'],
  ['/horses', 'Horse rides'],
];

const TONES = [
  ['blue', 'Blue'],
  ['green', 'Green'],
  ['orange', 'Orange'],
];

const EMPTY = {
  discount: '',
  title: '',
  description: '',
  discountMr: '',
  titleMr: '',
  descriptionMr: '',
  link: '/hotels',
  tone: 'blue',
  order: 0,
  isActive: true,
};

export default function HomepageDealsPage() {
  const [deals, setDeals] = useState([]);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset } = useForm({ defaultValues: EMPTY });

  const load = () => fetchHomepageDeals().then(setDeals).catch(() => toast.error('Failed to load deals'));
  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (data) => {
    const payload = { ...data, order: Number(data.order) || 0, isActive: Boolean(data.isActive) };
    try {
      if (editing) {
        await updateHomepageDeal(editing._id, payload);
        toast.success('Deal updated');
        setEditing(null);
      } else {
        await createHomepageDeal(payload);
        toast.success('Deal added');
      }
      reset(EMPTY);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const startEdit = (row) => {
    setEditing(row);
    reset({
      discount: row.discount || '',
      title: row.title || '',
      description: row.description || '',
      discountMr: row.discountMr || '',
      titleMr: row.titleMr || '',
      descriptionMr: row.descriptionMr || '',
      link: row.link || '/hotels',
      tone: row.tone || 'blue',
      order: row.order ?? 0,
      isActive: row.isActive !== false,
    });
  };

  const remove = async (row) => {
    if (!window.confirm(`Remove “${row.title}” from the homepage?`)) return;
    try {
      await deleteHomepageDeal(row._id);
      toast.success('Deal removed');
      if (editing?._id === row._id) {
        setEditing(null);
        reset(EMPTY);
      }
      load();
    } catch {
      toast.error('Could not remove deal');
    }
  };

  const columns = [
    { key: 'order', label: 'Order' },
    { key: 'discount', label: 'Offer' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Note' },
    { key: 'link', label: 'Opens' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <RowActions
          items={buildMasterActions({
            isActive: !!row.isActive,
            onEdit: () => startEdit(row),
            onToggleActive: async () => {
              try {
                await updateHomepageDeal(row._id, { ...row, isActive: !row.isActive });
                load();
              } catch {
                toast.error('Update failed');
              }
            },
            onDelete: () => remove(row),
            deleteLabel: 'Remove',
          })}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trending deals & offers"
        subtitle="These cards appear on the website and app homepage. Inactive deals stay hidden."
      />
      <form onSubmit={handleSubmit(onSubmit)} className="admin-card grid gap-4 p-6 sm:grid-cols-2">
        <input className="admin-input" placeholder="Offer, e.g. 30% off" {...register('discount', { required: true })} />
        <input className="admin-input" placeholder="Title, e.g. Monsoon Escape" {...register('title', { required: true })} />
        <input className="admin-input sm:col-span-2" placeholder="Short note" {...register('description')} />
        <input className="admin-input" placeholder="Offer in Marathi" {...register('discountMr')} />
        <input className="admin-input" placeholder="Title in Marathi" {...register('titleMr')} />
        <input className="admin-input sm:col-span-2" placeholder="Note in Marathi" {...register('descriptionMr')} />
        <select className="admin-input" {...register('link')}>
          {LINKS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select className="admin-input" {...register('tone')}>
          {TONES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input type="number" className="admin-input" placeholder="Order" {...register('order')} />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register('isActive')} />
          Show on homepage
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className="admin-btn-primary">{editing ? 'Update deal' : 'Add deal'}</button>
          {editing && (
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => {
                setEditing(null);
                reset(EMPTY);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <DataTable columns={columns} data={deals} />
    </div>
  );
}
