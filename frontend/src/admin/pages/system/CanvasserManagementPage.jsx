import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RowActions from '../../components/RowActions';
import FormLanguageToggle from '../../../components/common/FormLanguageToggle';
import { fetchCanvassers, updateCanvasser } from '../../../services/canvasserApi';

export default function CanvasserManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    fetchCanvassers({ search: search || undefined })
      .then(setRows)
      .catch(() => toast.error(t('canvasser.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [search]);

  const toggleActive = async (row) => {
    try {
      await updateCanvasser(row._id, { isActive: row.isActive === false });
      toast.success(row.isActive === false ? t('canvasser.activated') : t('canvasser.deactivated'));
      load();
    } catch {
      toast.error(t('canvasser.saveFailed'));
    }
  };

  const columns = [
    { key: 'fullName', label: t('canvasser.colName'), render: (r) => <span className="font-semibold">{r.fullName}</span> },
    { key: 'mobile', label: t('canvasser.colMobile') },
    {
      key: 'joiningDate',
      label: t('canvasser.colJoining'),
      render: (r) => (r.joiningDate ? new Date(r.joiningDate).toLocaleDateString('en-IN') : '—'),
    },
    {
      key: 'ownVehicle',
      label: t('canvasser.colVehicle'),
      render: (r) => (r.ownVehicle ? t('canvasser.yes') : t('canvasser.no')),
    },
    {
      key: 'drivingLicense',
      label: t('canvasser.colLicense'),
      render: (r) => (r.drivingLicense ? t('canvasser.yes') : t('canvasser.no')),
    },
    {
      key: 'status',
      label: t('canvasser.colStatus'),
      render: (r) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      label: t('canvasser.colActions'),
      render: (r) => (
        <RowActions
          items={[
            {
              key: 'edit',
              label: t('canvasser.edit'),
              onClick: () => navigate(`/admin/canvasser?edit=${r._id}`),
            },
            {
              key: 'toggle',
              label: r.isActive === false ? t('canvasser.activate') : t('canvasser.deactivate'),
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
        title={t('canvasser.managementTitle')}
        subtitle={t('canvasser.managementSubtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FormLanguageToggle />
            <Link to="/admin/canvasser" className="admin-btn-primary">
              {t('canvasser.createCta')}
            </Link>
          </div>
        }
      />

      <div className="admin-card p-4">
        <input
          className="admin-input max-w-md"
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        emptyMessage={loading ? t('common.loading') : t('canvasser.empty')}
      />
    </div>
  );
}
