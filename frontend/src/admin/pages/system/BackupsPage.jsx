import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { fetchBackups, triggerBackup, restoreBackup } from '../../../services/enterpriseAdminApi';

export default function BackupsPage() {
  const [items, setItems] = useState([]);

  const load = () => {
    fetchBackups()
      .then(setItems)
      .catch(() => toast.error('Failed to load backups'));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backup Management"
        subtitle="Daily/weekly automatic backups + manual restore"
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              className="admin-btn-primary"
              onClick={async () => {
                try {
                  await triggerBackup({ type: 'MANUAL', scope: 'FULL' });
                  toast.success('Backup completed');
                  load();
                } catch (e) {
                  toast.error(e.response?.data?.message || 'Backup failed');
                }
              }}
            >
              Run full backup
            </button>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={async () => {
                try {
                  await triggerBackup({ type: 'MANUAL', scope: 'DATABASE' });
                  toast.success('DB backup done');
                  load();
                } catch {
                  toast.error('Failed');
                }
              }}
            >
              DB only
            </button>
          </div>
        }
      />

      <DataTable
        columns={[
          { key: 'type', label: 'Type' },
          { key: 'scope', label: 'Scope' },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'sizeBytes',
            label: 'Size',
            render: (r) => `${Math.round((r.sizeBytes || 0) / 1024)} KB`,
          },
          {
            key: 'createdAt',
            label: 'When',
            render: (r) => new Date(r.createdAt).toLocaleString(),
          },
          {
            key: 'actions',
            label: 'Restore',
            render: (r) =>
              r.status === 'SUCCESS' ? (
                <button
                  type="button"
                  className="text-sm font-semibold text-red-600"
                  onClick={async () => {
                    if (!window.confirm('Restore will overwrite collections. Continue?')) return;
                    try {
                      await restoreBackup(r._id);
                      toast.success('Restored');
                    } catch (e) {
                      toast.error(e.response?.data?.message || 'Restore failed');
                    }
                  }}
                >
                  Restore
                </button>
              ) : (
                '—'
              ),
          },
        ]}
        data={items}
      />
    </div>
  );
}
