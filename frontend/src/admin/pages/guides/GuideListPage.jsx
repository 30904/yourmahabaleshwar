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
  fetchAdminGuides,
  createGuide,
  updateGuide,
  deleteGuide,
} from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';

const emptyForm = {
  name: '',
  bio: '',
  languages: 'English, Marathi',
  specialties: 'Sightseeing',
  package6hr: 1500,
  package12hr: 2500,
  bikeAddonPrice: 500,
};

export default function GuideListPage({ kycFilter }) {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ mode: null, row: null });
  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyForm });

  const load = () => {
    setLoading(true);
    fetchAdminGuides({
      kycStatus: kycFilter === 'pending' ? 'PENDING' : kycFilter === 'approved' ? 'APPROVED' : undefined,
    })
      .then(setGuides)
      .catch(() => toast.error('Failed to load guides'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [kycFilter]);

  const openAdd = () => {
    reset(emptyForm);
    setModal({ mode: 'add', row: null });
  };

  const openEdit = (row) => {
    reset({
      name: row.name || '',
      bio: row.bio || '',
      languages: (row.languages || []).join(', '),
      specialties: (row.specialties || []).join(', '),
      package6hr: row.package6hr || 0,
      package12hr: row.package12hr || 0,
      bikeAddonPrice: row.bikeAddonPrice || 0,
    });
    setModal({ mode: 'edit', row });
  };

  const splitList = (v) =>
    String(v || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const onSave = async (data) => {
    const payload = {
      name: data.name,
      bio: data.bio,
      languages: splitList(data.languages),
      specialties: splitList(data.specialties),
      package6hr: Number(data.package6hr),
      package12hr: Number(data.package12hr),
      bikeAddonPrice: Number(data.bikeAddonPrice) || 0,
      isActive: true,
    };
    try {
      if (modal.mode === 'edit' && modal.row) {
        await updateGuide(modal.row._id, payload);
        toast.success('Guide updated');
      } else {
        await createGuide(payload);
        toast.success('Guide added');
      }
      setModal({ mode: null, row: null });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const toggleActive = async (row) => {
    try {
      await updateGuide(row._id, { isActive: row.isActive === false });
      toast.success(row.isActive === false ? 'Marked active' : 'Marked inactive');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete guide "${row.name}"? This cannot be undone.`)) return;
    try {
      await deleteGuide(row._id);
      toast.success('Guide deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Guide', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'languages', label: 'Languages', render: (r) => r.languages?.join(', ') },
    { key: 'package6hr', label: '6hr', render: (r) => formatCurrency(r.package6hr) },
    { key: 'package12hr', label: '12hr', render: (r) => formatCurrency(r.package12hr) },
    { key: 'kyc', label: 'KYC', render: (r) => <StatusBadge status={r.kyc?.status || 'NONE'} /> },
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

  const title = kycFilter === 'pending' ? 'Pending KYC' : kycFilter === 'approved' ? 'Approved Guides' : 'All Guides';
  const viewing = modal.mode === 'view' ? modal.row : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle="Guide onboarding & packages"
        actions={
          !kycFilter ? (
            <button type="button" className="admin-btn-primary" onClick={openAdd}>
              <Plus size={18} /> Add Guide
            </button>
          ) : null
        }
      />
      {loading ? (
        <div className="admin-card p-12 text-center">Loading...</div>
      ) : (
        <DataTable columns={columns} data={guides} />
      )}

      <AdminModal
        open={modal.mode === 'add' || modal.mode === 'edit'}
        title={modal.mode === 'edit' ? 'Edit Guide' : 'Add Guide'}
        onClose={() => setModal({ mode: null, row: null })}
      >
        <form onSubmit={handleSubmit(onSave)} className="grid gap-3 sm:grid-cols-2">
          <input className="admin-input sm:col-span-2" placeholder="Name" {...register('name', { required: true })} />
          <input className="admin-input sm:col-span-2" placeholder="Bio" {...register('bio')} />
          <input className="admin-input" placeholder="Languages (comma)" {...register('languages')} />
          <input className="admin-input" placeholder="Specialties (comma)" {...register('specialties')} />
          <input type="number" className="admin-input" placeholder="6hr (₹)" {...register('package6hr')} />
          <input type="number" className="admin-input" placeholder="12hr (₹)" {...register('package12hr')} />
          <input type="number" className="admin-input" placeholder="Bike addon (₹)" {...register('bikeAddonPrice')} />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="admin-btn-secondary" onClick={() => setModal({ mode: null, row: null })}>
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary">Save</button>
          </div>
        </form>
      </AdminModal>

      <AdminModal open={!!viewing} title={viewing?.name || 'Guide'} onClose={() => setModal({ mode: null, row: null })}>
        {viewing && (
          <div className="space-y-2 text-sm text-slate-700">
            <p>{viewing.bio || '—'}</p>
            <p><span className="font-semibold">Languages:</span> {(viewing.languages || []).join(', ')}</p>
            <p><span className="font-semibold">6hr / 12hr:</span> {formatCurrency(viewing.package6hr)} / {formatCurrency(viewing.package12hr)}</p>
            <p><span className="font-semibold">Status:</span> {viewing.isActive !== false ? 'Active' : 'Inactive'}</p>
            {viewing.slug && (
              <a className="text-primary underline" href={`/guides/${viewing.slug}`} target="_blank" rel="noreferrer">
                Open public page
              </a>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
