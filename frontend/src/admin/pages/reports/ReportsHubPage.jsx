import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import { fetchReportsHub } from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';
import api from '../../../services/api';

const EXPORT_TYPES = [
  { id: 'bookings', label: 'Bookings' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'gst', label: 'GST' },
  { id: 'refunds', label: 'Refunds' },
  { id: 'payments', label: 'Payments' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'ads', label: 'Ads' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'customers', label: 'Customers' },
];

export default function ReportsHubPage({ focus }) {
  const [data, setData] = useState(null);
  const [range, setRange] = useState({ from: '', to: '' });
  const [exportType, setExportType] = useState(focus || 'bookings');

  const load = () => {
    fetchReportsHub(range.from || range.to ? range : undefined)
      .then(setData)
      .catch(() => toast.error('Failed to load reports'));
  };

  useEffect(() => {
    load();
  }, []);

  const downloadExcel = async () => {
    try {
      const res = await api.get('/admin/reports/hub/export', {
        params: { type: exportType, ...range },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportType}-report.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  if (!data) return <div className="admin-card p-12 text-center">Loading reports...</div>;

  const show = (section) => !focus || focus === section;

  return (
    <div className="space-y-6">
      <PageHeader
        title={focus === 'gst' ? 'GST Reports' : focus === 'revenue' ? 'Revenue Reports' : 'Reports Hub'}
        subtitle="Bookings, payments, subscriptions, ads, refunds — export to Excel"
        actions={
          <div className="flex flex-wrap gap-2">
            <input type="date" className="admin-input" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
            <input type="date" className="admin-input" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
            <button type="button" className="admin-btn-primary" onClick={load}>Apply</button>
            <select className="admin-input" value={exportType} onChange={(e) => setExportType(e.target.value)}>
              {EXPORT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <button type="button" className="admin-btn-primary" onClick={downloadExcel}>Export Excel</button>
          </div>
        }
      />

      {show('revenue') && (
        <div className="admin-card p-5">
          <h3 className="font-semibold">Revenue</h3>
          <p className="mt-1 text-3xl font-bold text-primary">{formatCurrency(data.revenue?.total || 0)}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(data.bookings || []).map((b) => (
              <div key={b._id} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{b._id}</p>
                <p className="font-bold">{formatCurrency(b.revenue)}</p>
                <p className="text-xs">{b.count} bookings · GST {formatCurrency(b.gst)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {show('gst') && (
        <div className="admin-card p-5">
          <h3 className="font-semibold">GST collected</h3>
          <p className="mt-1 text-3xl font-bold">{formatCurrency(data.gst?.total || 0)}</p>
          <div className="mt-3 space-y-2">
            {(data.gst?.byType || []).map((b) => (
              <div key={b._id} className="flex justify-between text-sm">
                <span>{b._id}</span>
                <span className="font-medium">{formatCurrency(b.gst)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {show('subscriptions') && (
        <div className="admin-card p-5">
          <h3 className="font-semibold">Subscriptions</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(data.subscriptions || []).map((s) => (
              <div key={s._id} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{s._id}</p>
                <p className="font-bold">{s.count}</p>
                <p className="text-xs">{formatCurrency(s.revenue || 0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {show('ads') && (
        <div className="admin-card p-5">
          <h3 className="font-semibold">Advertisements</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(data.advertisements || []).map((a) => (
              <div key={a._id} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{a._id}</p>
                <p className="font-bold">{a.count} · {formatCurrency(a.revenue || 0)}</p>
                <p className="text-xs">{a.impressions || 0} impr / {a.clicks || 0} clicks</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {show('refunds') && (
        <div className="admin-card p-5">
          <h3 className="font-semibold">Refunds</h3>
          <div className="mt-3 space-y-2">
            {(data.refunds || []).length === 0 && <p className="text-sm text-slate-500">No refunds in range</p>}
            {(data.refunds || []).map((r) => (
              <div key={r._id} className="flex justify-between text-sm">
                <span>{r._id || 'UNKNOWN'}</span>
                <span>{r.count} · {formatCurrency(r.amount || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {show('payments') && (
        <div className="admin-card p-5">
          <h3 className="font-semibold">Payments</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(data.payments || []).map((p) => (
              <div key={p._id} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{p._id}</p>
                <p className="font-bold">{formatCurrency(p.amount)}</p>
                <p className="text-xs">{p.count} txns</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
