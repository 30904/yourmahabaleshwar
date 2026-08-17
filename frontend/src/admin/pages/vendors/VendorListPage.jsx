import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RowActions, { buildMasterActions } from '../../components/RowActions';
import { fetchAdminVendors } from '../../../services/enterpriseAdminApi';
import api from '../../../services/api';

export default function VendorListPage({ role }) {
  const [vendors, setVendors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = () =>
    fetchAdminVendors({ role })
      .then(setVendors)
      .catch(() => toast.error('Failed to load vendors'));

  useEffect(() => {
    load();
  }, [role]);

  const toggleActive = async (row) => {
    try {
      await api.patch(`/admin/users/${row._id}`, { isActive: row.isActive === false });
      toast.success(row.isActive === false ? 'Marked active' : 'Marked inactive');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const rows = vendors.filter((v) => {
    if (statusFilter === 'active') return v.isActive !== false;
    if (statusFilter === 'inactive') return v.isActive === false;
    return true;
  });

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role', render: (r) => r.role?.replace(/_/g, ' ') },
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
            onToggleActive: () => toggleActive(r),
          })}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        subtitle="Admin sees all vendors. Inactive accounts cannot sign in."
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
    </div>
  );
}
