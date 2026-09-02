import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import {
  fetchServiceMonetizationAdmin,
  updateServiceMonetizationAdmin,
} from '../../../services/serviceMonetizationApi';

const TENANTS = ['GUIDE', 'TAXI', 'DRIVER', 'TENT', 'HORSE'];

const FIELDS = [
  { key: 'rupeesPerPoint', label: '₹ per point', type: 'number' },
  { key: 'pointsPerBooking', label: 'Points per booking', type: 'number' },
  { key: 'unlimitedMonthlyPrice', label: 'Unlimited monthly price (₹)', type: 'number' },
  { key: 'lowPointThreshold', label: 'Low points warning threshold', type: 'number' },
  { key: 'unlimitedWarningDays', label: 'Unlimited expiry warning (days)', type: 'number' },
];

export default function ServiceMonetizationPage() {
  const [config, setConfig] = useState({});
  const [activeTenant, setActiveTenant] = useState('GUIDE');
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchServiceMonetizationAdmin()
      .then((data) => {
        setConfig(data || {});
        setDraft(data?.[activeTenant] || {});
      })
      .catch(() => toast.error('Failed to load service monetization settings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setDraft(config[activeTenant] || {});
  }, [activeTenant, config]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateServiceMonetizationAdmin(activeTenant, draft);
      setConfig((prev) => ({ ...prev, [activeTenant]: updated }));
      toast.success(`${activeTenant} settings saved`);
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <PageHeader
        title="Service subscription settings"
        subtitle="Points recharge rates and unlimited monthly pricing per tenant (guides, taxi, drivers, tents, horses)"
        actions={
          <button type="submit" className="admin-btn-primary" disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {TENANTS.map((tenant) => (
          <button
            key={tenant}
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTenant === tenant ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'}`}
            onClick={() => setActiveTenant(tenant)}
          >
            {tenant}
          </button>
        ))}
      </div>

      <div className="admin-card grid gap-4 p-6 sm:grid-cols-2">
        {loading ? (
          <p className="sm:col-span-2 text-slate-500">Loading…</p>
        ) : (
          FIELDS.map(({ key, label, type }) => (
            <label key={key} className="admin-label">
              {label}
              <input
                type={type}
                min="0"
                className="admin-input"
                value={draft[key] ?? ''}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                  }))
                }
              />
            </label>
          ))
        )}
        <p className="sm:col-span-2 text-sm text-slate-500">
          Example: if ₹ per point is 1 and a customer recharges ₹500, the vendor receives 500 points.
          Each accepted booking deducts the configured points (unless unlimited monthly is active).
        </p>
      </div>
    </form>
  );
}
