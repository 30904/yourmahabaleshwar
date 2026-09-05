import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RowActions from '../../components/RowActions';
import { fetchStaffList, updateStaff } from '../../../services/staffApi';
import { ROLES } from '../../../constants/roles';

const STAFF_ROLE_OPTIONS = [
  { value: ROLES.OFFICE_STAFF_HOTEL, label: 'Office Staff — Hotel' },
  { value: ROLES.OFFICE_STAFF_GUIDE, label: 'Office Staff — Guide' },
  { value: ROLES.MARKETING_STAFF, label: 'Marketing Staff' },
];

export default function StaffManagementPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchStaffList()
      .then(setRows)
      .catch(() => toast.error('Failed to load staff'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (row) => {
    try {
      await updateStaff(row._id, { isActive: row.isActive === false });
      toast.success(row.isActive === false ? 'Staff activated' : 'Staff deactivated');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'email', label: 'Login email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'role',
      label: 'Role',
      render: (r) => STAFF_ROLE_OPTIONS.find((o) => o.value === r.role)?.label || r.role,
    },
    {
      key: 'employeeId',
      label: 'Employee ID',
      render: (r) => r.profile?.employeeId || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <RowActions
          items={[
            {
              key: 'edit',
              label: 'Edit',
              onClick: () => navigate(`/admin/staff?edit=${r._id}`),
            },
            {
              key: 'toggle',
              label: r.isActive === false ? 'Activate' : 'Deactivate',
              onClick: () => toggleActive(r),
              tone: r.isActive === false ? undefined : 'muted',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Management"
        subtitle="View staff accounts, edit details, and activate or deactivate login access"
        actions={
          <Link to="/admin/staff" className="admin-btn-primary">
            Create staff
          </Link>
        }
      />

      <DataTable columns={columns} data={rows} emptyMessage={loading ? 'Loading…' : 'No staff members yet.'} />
    </div>
  );
}
