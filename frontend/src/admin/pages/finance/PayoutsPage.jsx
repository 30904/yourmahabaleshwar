import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import {
  fetchDetailedPayouts,
  generatePayouts,
  updatePayout,
  fetchWallet,
} from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [walletPreview, setWalletPreview] = useState(null);

  const load = () => {
    fetchDetailedPayouts()
      .then(setPayouts)
      .catch(() => toast.error('Failed to load payouts'));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Payouts"
        subtitle="Generate settlements, mark paid, track wallet"
        actions={
          <button
            type="button"
            className="admin-btn-primary"
            onClick={async () => {
              try {
                const created = await generatePayouts();
                toast.success(`Generated ${created?.length || 0} payouts`);
                load();
              } catch (e) {
                toast.error(e.response?.data?.message || 'Generate failed');
              }
            }}
          >
            Generate from paid bookings
          </button>
        }
      />

      <div className="admin-card p-4">
        <label className="text-sm font-medium">Preview vendor wallet (vendor ID)</label>
        <div className="mt-2 flex gap-2">
          <input
            className="admin-input"
            placeholder="Vendor user id"
            onBlur={async (e) => {
              if (!e.target.value) return;
              try {
                setWalletPreview(await fetchWallet({ vendorId: e.target.value }));
              } catch {
                toast.error('Wallet not found');
              }
            }}
          />
        </div>
        {walletPreview?.user && (
          <p className="mt-2 text-sm">
            {walletPreview.user.name}: wallet {formatCurrency(walletPreview.user.walletBalance)} · points {walletPreview.user.pointBalance}
          </p>
        )}
      </div>

      <DataTable
        columns={[
          { key: 'vendor', label: 'Vendor', render: (r) => r.vendor?.name || '—' },
          { key: 'amount', label: 'Gross', render: (r) => formatCurrency(r.amount) },
          { key: 'commission', label: 'Commission', render: (r) => formatCurrency(r.commission) },
          { key: 'netAmount', label: 'Net', render: (r) => formatCurrency(r.netAmount) },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'actions',
            label: 'Actions',
            render: (r) =>
              r.status === 'PENDING' || r.status === 'PROCESSING' ? (
                <button
                  type="button"
                  className="text-sm font-semibold text-primary"
                  onClick={async () => {
                    await updatePayout(r._id, { status: 'PAID', transactionRef: `TXN${Date.now()}` });
                    toast.success('Marked paid');
                    load();
                  }}
                >
                  Mark paid
                </button>
              ) : (
                '—'
              ),
          },
        ]}
        data={payouts}
      />
    </div>
  );
}
