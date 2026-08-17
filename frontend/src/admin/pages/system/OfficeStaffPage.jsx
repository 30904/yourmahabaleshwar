import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import api from '../../../services/api';

const STAFF_ROLES = ['OFFICE_STAFF_HOTEL', 'OFFICE_STAFF_GUIDE', 'MARKETING_STAFF', 'SUPER_ADMIN'];

export default function OfficeStaffPage() {
  const [rows, setRows] = useState([]);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { role: 'OFFICE_STAFF_HOTEL' },
  });

  const load = () =>
    api
      .get('/admin/users')
      .then((r) => {
        const all = r.data.data || [];
        setRows(all.filter((u) => STAFF_ROLES.includes(u.role)));
      })
      .catch(() => toast.error('Failed to load staff'));

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/admin/users', data);
      toast.success('Staff created');
      reset({ role: 'OFFICE_STAFF_HOTEL', name: '', email: '', phone: '', password: '' });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Create failed');
    }
  };

  const toggleActive = async (row) => {
    try {
      await api.patch(`/admin/users/${row._id}`, { isActive: !row.isActive });
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <button type="button" className="text-sm text-primary" onClick={() => toggleActive(r)}>
          {r.isActive === false ? 'Activate' : 'Deactivate'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Office Staff" subtitle="Admin, office and marketing users" />
      <form onSubmit={handleSubmit(onSubmit)} className="admin-card grid gap-3 p-6 sm:grid-cols-3">
        <input className="admin-input" placeholder="Name" {...register('name', { required: true })} />
        <input className="admin-input" placeholder="Email" type="email" {...register('email', { required: true })} />
        <input className="admin-input" placeholder="Phone" {...register('phone')} />
        <input className="admin-input" placeholder="Temp password" type="password" {...register('password', { required: true, minLength: 6 })} />
        <select className="admin-input" {...register('role')}>
          <option value="OFFICE_STAFF_HOTEL">Office Staff — Hotel</option>
          <option value="OFFICE_STAFF_GUIDE">Office Staff — Guide</option>
          <option value="MARKETING_STAFF">Marketing Staff</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
        <button type="submit" className="admin-btn-primary">
          Add staff
        </button>
      </form>
      <DataTable columns={columns} data={rows} />
    </div>
  );
}
