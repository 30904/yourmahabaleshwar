import { useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import api from '../../../services/api';

const actions = [
  { label: 'Seed document requirements', method: 'post', path: '/admin/document-requirements/seed' },
  { label: 'Seed notification templates', method: 'post', path: '/admin/notification-templates/seed' },
  { label: 'List audit logs', method: 'get', path: '/admin/audit-logs' },
  { label: 'List payments', method: 'get', path: '/admin/payments' },
  { label: 'List refunds', method: 'get', path: '/admin/refunds' },
  { label: 'Destinations analytics', method: 'get', path: '/admin/analytics/destinations' },
  { label: 'Commission rates', method: 'get', path: '/admin/commission-rates' },
  { label: 'Admin homestays/villas', method: 'get', path: '/admin/enterprise/homestays' },
  { label: 'Admin horses', method: 'get', path: '/admin/enterprise/horses' },
];

export default function DomainToolsPage() {
  const [result, setResult] = useState(null);

  const run = async (a) => {
    try {
      const res = await api[a.method](a.path);
      setResult(res.data);
      toast.success(`${a.label} OK`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
      setResult(e.response?.data || { error: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Domain API Tools"
        subtitle="Phase 1C backend domain — seeders, audit, payments, destinations (minimal UI)"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a) => (
          <button key={a.path + a.label} type="button" className="admin-card p-4 text-left hover:border-primary" onClick={() => run(a)}>
            <p className="font-semibold text-slate-900">{a.label}</p>
            <p className="mt-1 text-xs uppercase text-slate-500">{a.method} {a.path}</p>
          </button>
        ))}
      </div>
      {result && (
        <pre className="admin-card max-h-96 overflow-auto p-4 text-xs">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
