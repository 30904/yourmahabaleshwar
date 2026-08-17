import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { fetchCampaigns, createCampaign, sendCampaign } from '../../../services/enterpriseAdminApi';

export default function CampaignsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: '',
    channel: 'EMAIL',
    subject: '',
    message: '',
    audience: 'ALL_CUSTOMERS',
  });

  const load = () => {
    fetchCampaigns()
      .then(setItems)
      .catch(() => toast.error('Failed to load campaigns'));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Marketing Campaigns" subtitle="Bulk Email, SMS & WhatsApp" />

      <div className="admin-card space-y-3 p-5">
        <h3 className="font-semibold">New campaign</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="admin-input" placeholder="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="admin-input" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
          <input className="admin-input" placeholder="Subject (email)" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <select className="admin-input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
            <option value="ALL_CUSTOMERS">All customers</option>
            <option value="ALL_VENDORS">All vendors</option>
          </select>
        </div>
        <textarea
          className="admin-input"
          rows={3}
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
        <button
          type="button"
          className="admin-btn-primary"
          onClick={async () => {
            try {
              await createCampaign(form);
              toast.success('Campaign created');
              setForm({ name: '', channel: 'EMAIL', subject: '', message: '', audience: 'ALL_CUSTOMERS' });
              load();
            } catch (e) {
              toast.error(e.response?.data?.message || 'Failed');
            }
          }}
        >
          Save draft
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'channel', label: 'Channel' },
          { key: 'audience', label: 'Audience' },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'stats',
            label: 'Stats',
            render: (r) => `${r.stats?.sent || 0}/${r.stats?.targeted || 0} sent`,
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (r) =>
              r.status === 'DRAFT' || r.status === 'SCHEDULED' ? (
                <button
                  type="button"
                  className="text-sm font-semibold text-primary"
                  onClick={async () => {
                    try {
                      await sendCampaign(r._id);
                      toast.success('Campaign sent');
                      load();
                    } catch (e) {
                      toast.error(e.response?.data?.message || 'Send failed');
                    }
                  }}
                >
                  Send now
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
