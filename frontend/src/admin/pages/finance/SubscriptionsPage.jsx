import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import {
  fetchSubscriptionPlans,
  fetchSubscriptions,
  assignSubscription,
  purchaseVendorPoints,
  seedPhase1bDefaults,
  createSubscriptionPlan,
  fetchAdminVendors,
} from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState([]);
  const [subs, setSubs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ vendorId: '', planId: '', points: 100 });

  const load = async () => {
    try {
      const [p, s, v] = await Promise.all([
        fetchSubscriptionPlans(),
        fetchSubscriptions(),
        fetchAdminVendors(),
      ]);
      setPlans(p || []);
      setSubs(s || []);
      setVendors(v?.items || v || []);
    } catch {
      toast.error('Failed to load subscriptions');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions & Points"
        subtitle="Monthly plans and point-based booking acceptance"
        actions={
          <button
            type="button"
            className="admin-btn-primary"
            onClick={async () => {
              await seedPhase1bDefaults();
              toast.success('Default plans seeded');
              load();
            }}
          >
            Seed defaults
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p._id} className="admin-card p-5">
            <p className="text-sm text-slate-500">{p.code}</p>
            <p className="text-lg font-bold">{p.name}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(p.priceMonthly)}/mo</p>
            <p className="mt-2 text-xs text-slate-500">{p.pointsIncluded || 0} points included · {p.durationDays} days</p>
          </div>
        ))}
      </div>

      <div className="admin-card space-y-3 p-5">
        <h3 className="font-semibold">Assign subscription</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            className="admin-input"
            value={form.vendorId}
            onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
          >
            <option value="">Select vendor</option>
            {(Array.isArray(vendors) ? vendors : []).map((v) => (
              <option key={v._id} value={v._id}>{v.name || v.email} ({v.role})</option>
            ))}
          </select>
          <select
            className="admin-input"
            value={form.planId}
            onChange={(e) => setForm({ ...form, planId: e.target.value })}
          >
            <option value="">Select plan</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={async () => {
              try {
                await assignSubscription({ vendorId: form.vendorId, planId: form.planId });
                toast.success('Assigned');
                load();
              } catch (e) {
                toast.error(e.response?.data?.message || 'Failed');
              }
            }}
          >
            Assign
          </button>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          <input
            type="number"
            className="admin-input max-w-[120px]"
            value={form.points}
            onChange={(e) => setForm({ ...form, points: e.target.value })}
          />
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={async () => {
              try {
                await purchaseVendorPoints({ vendorId: form.vendorId, points: Number(form.points) });
                toast.success('Points added');
              } catch (e) {
                toast.error(e.response?.data?.message || 'Failed');
              }
            }}
          >
            Add points to vendor
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={async () => {
              try {
                await createSubscriptionPlan({
                  name: 'Custom Plan',
                  code: `CUSTOM${Date.now().toString(36).toUpperCase()}`,
                  priceMonthly: 1499,
                  durationDays: 30,
                  pointsIncluded: 100,
                });
                toast.success('Plan created');
                load();
              } catch {
                toast.error('Create failed');
              }
            }}
          >
            Quick-add plan
          </button>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'vendor', label: 'Vendor', render: (r) => r.vendor?.name || '—' },
          { key: 'plan', label: 'Plan', render: (r) => r.plan?.name || '—' },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'endDate', label: 'Ends', render: (r) => r.endDate ? new Date(r.endDate).toLocaleDateString() : '—' },
          { key: 'amountPaid', label: 'Paid', render: (r) => formatCurrency(r.amountPaid || 0) },
        ]}
        data={subs}
      />
    </div>
  );
}
