import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import api from '../../../services/api';

export default function EnquiriesPage() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');

  const load = () =>
    api
      .get('/enquiries', { params: status ? { status } : {} })
      .then((r) => setRows(r.data.data || []))
      .catch(() => toast.error('Failed to load enquiries'));

  useEffect(() => {
    load();
  }, [status]);

  const updateStatus = async (id, next) => {
    try {
      await api.patch(`/enquiries/${id}`, { status: next });
      toast.success('Updated');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'type', label: 'Type', render: (r) => r.type || r.enquiryType || '—' },
    { key: 'message', label: 'Message', render: (r) => <span className="line-clamp-2 text-sm">{r.message}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status || 'NEW'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button type="button" className="text-xs text-primary" onClick={() => updateStatus(r._id, 'CONTACTED')}>
            Contacted
          </button>
          <button type="button" className="text-xs text-emerald-600" onClick={() => updateStatus(r._id, 'CLOSED')}>
            Close
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enquiries"
        subtitle="Driver / hourly / general enquiries"
        actions={
          <select className="admin-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CLOSED">Closed</option>
          </select>
        }
      />
      <DataTable columns={columns} data={rows} />
    </div>
  );
}
