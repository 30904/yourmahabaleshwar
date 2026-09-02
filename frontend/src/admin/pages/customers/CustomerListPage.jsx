import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RowActions, { buildMasterActions } from '../../components/RowActions';
import CustomerDetailModal from '../../components/CustomerDetailModal';
import { fetchAdminCustomers } from '../../../services/enterpriseAdminApi';
import api from '../../../services/api';

export default function CustomerListPage() {
  const [customers, setCustomers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewCustomerId, setViewCustomerId] = useState(null);

  const load = () =>
    fetchAdminCustomers()
      .then(setCustomers)
      .catch(() => toast.error('Failed to load customers'));

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (row) => {
    try {
      await api.patch(`/admin/users/${row._id}`, { isActive: row.isActive === false });
      toast.success(row.isActive === false ? 'Marked active' : 'Marked inactive');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const rows = customers.filter((c) => {
    if (statusFilter === 'active') return c.isActive !== false;
    if (statusFilter === 'inactive') return c.isActive === false;
    return true;
  });

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />,
    },
    { key: 'createdAt', label: 'Joined', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      label: 'Action',
      render: (r) => (
        <RowActions
          items={buildMasterActions({
            isActive: r.isActive !== false,
            onView: () => setViewCustomerId(r._id),
            onToggleActive: () => toggleActive(r),
          })}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Admin sees all accounts. Inactive users cannot sign in on the website/app."
      />
      <div className="admin-card flex flex-wrap items-center gap-3 p-4">
        <select
          className="admin-input w-auto min-w-[140px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <p className="text-sm text-slate-500">{rows.length} shown</p>
      </div>
      <DataTable columns={columns} data={rows} />
      <CustomerDetailModal
        open={!!viewCustomerId}
        customerId={viewCustomerId}
        onClose={() => setViewCustomerId(null)}
      />
    </div>
  );
}
