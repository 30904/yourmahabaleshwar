import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import {
  fetchAdPackages,
  fetchAdvertisements,
  fetchAdAnalytics,
  fetchFeaturedListings,
  createAdvertisement,
  setFeaturedListing,
  seedPhase1bDefaults,
} from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';

export default function AdsPage() {
  const [packages, setPackages] = useState([]);
  const [ads, setAds] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [featured, setFeatured] = useState(null);
  const [form, setForm] = useState({ packageId: '', listingType: 'HOTEL', listingId: '' });

  const load = async () => {
    try {
      const [p, a, an, f] = await Promise.all([
        fetchAdPackages(),
        fetchAdvertisements(),
        fetchAdAnalytics(),
        fetchFeaturedListings(),
      ]);
      setPackages(p || []);
      setAds(a || []);
      setAnalytics(an);
      setFeatured(f);
    } catch {
      toast.error('Failed to load ads');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advertisements"
        subtitle="Packages, featured listings, banners & analytics"
        actions={
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={async () => {
              await seedPhase1bDefaults();
              toast.success('Ad packages seeded');
              load();
            }}
          >
            Seed packages
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {(analytics?.byStatus || []).map((row) => (
          <div key={row._id} className="admin-card p-4">
            <p className="text-sm text-slate-500">{row._id}</p>
            <p className="text-xl font-bold">{row.count} ads</p>
            <p className="text-xs text-slate-500">
              {row.impressions || 0} impressions · {row.clicks || 0} clicks · {formatCurrency(row.revenue || 0)}
            </p>
          </div>
        ))}
      </div>

      <div className="admin-card space-y-3 p-5">
        <h3 className="font-semibold">Activate advertisement</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <select className="admin-input" value={form.packageId} onChange={(e) => setForm({ ...form, packageId: e.target.value })}>
            <option value="">Package</option>
            {packages.map((p) => (
              <option key={p._id} value={p._id}>{p.name} ({formatCurrency(p.price)})</option>
            ))}
          </select>
          <select className="admin-input" value={form.listingType} onChange={(e) => setForm({ ...form, listingType: e.target.value })}>
            {['HOTEL', 'RESORT', 'HOMESTAY', 'TENT', 'HORSE', 'BANNER'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input className="admin-input" placeholder="Listing ID" value={form.listingId} onChange={(e) => setForm({ ...form, listingId: e.target.value })} />
          <button
            type="button"
            className="admin-btn-primary"
            onClick={async () => {
              try {
                await createAdvertisement({
                  packageId: form.packageId,
                  listingType: form.listingType,
                  listingId: form.listingId,
                });
                toast.success('Ad activated');
                load();
              } catch (e) {
                toast.error(e.response?.data?.message || 'Failed');
              }
            }}
          >
            Activate
          </button>
        </div>
      </div>

      <div className="admin-card p-5">
        <h3 className="mb-3 font-semibold">Currently featured</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          {(featured?.hotels || []).map((h) => (
            <button
              key={h._id}
              type="button"
              className="rounded-full bg-amber-50 px-3 py-1 text-amber-800"
              onClick={async () => {
                await setFeaturedListing({ listingType: 'HOTEL', listingId: h._id, isFeatured: false });
                load();
              }}
            >
              {h.name} ×
            </button>
          ))}
          {(featured?.tents || []).map((h) => (
            <span key={h._id} className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">{h.name}</span>
          ))}
          {(featured?.homestays || []).map((h) => (
            <span key={h._id} className="rounded-full bg-rose-50 px-3 py-1 text-rose-800">{h.name}</span>
          ))}
          {!featured?.hotels?.length && !featured?.tents?.length && (
            <p className="text-slate-500">No featured listings</p>
          )}
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'package', label: 'Package', render: (r) => r.package?.name || '—' },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'impressions', label: 'Impr.' },
          { key: 'clicks', label: 'Clicks' },
          { key: 'endDate', label: 'Ends', render: (r) => (r.endDate ? new Date(r.endDate).toLocaleDateString() : '—') },
        ]}
        data={ads}
      />
    </div>
  );
}
