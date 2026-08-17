import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { fetchFinanceSummary } from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';

export default function FinancePage({ section }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinanceSummary()
      .then(setData)
      .catch(() => toast.error('Failed to load finance data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-card p-12 text-center">Loading...</div>;

  const titles = { commission: 'Commission Reports', transactions: 'Payment Transactions', gst: 'GST Reports' };

  return (
    <div className="space-y-6">
      <PageHeader title={titles[section] || 'Finance Overview'} subtitle="Revenue, payouts & transactions" />
      <div className="grid gap-4 sm:grid-cols-3">
        {(data?.revenueByType || []).map((r) => (
          <div key={r._id} className="admin-card p-5">
            <p className="text-sm text-slate-500">{r._id}</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(r.total)}</p>
            <p className="text-xs text-slate-500">Commission {formatCurrency(r.commission)} · {r.count} bookings</p>
          </div>
        ))}
      </div>
      {section !== 'commission' && (
        <DataTable
          columns={[
            { key: 'bookingNumber', label: 'Ref' },
            { key: 'type', label: 'Type' },
            { key: 'total', label: 'Amount', render: (r) => formatCurrency(r.total) },
            { key: 'paymentStatus', label: 'Status', render: (r) => <StatusBadge status={r.paymentStatus} /> },
          ]}
          data={data?.transactions || []}
        />
      )}
    </div>
  );
}