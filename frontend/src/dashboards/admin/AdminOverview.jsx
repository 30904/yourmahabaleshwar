import { useEffect, useState } from 'react';
import { Building2, Users, Calendar } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import CurrencyIcon from '../../components/common/CurrencyIcon';
import { fetchDashboardStats } from '../../services/adminApi';
import { formatCurrency } from '../../utils/format';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-48" />;

  const revenue = stats?.revenue?.total || 0;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">Platform Analytics</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Building2} label="Hotels" value={String(stats?.hotels ?? 0)} color="primary" />
        <StatCard icon={Users} label="Users" value={String(stats?.users ?? 0)} color="primary" />
        <StatCard icon={Calendar} label="Bookings" value={String(stats?.bookings ?? 0)} color="primary" />
        <StatCard icon={CurrencyIcon} label="Revenue" value={formatCurrency(revenue)} color="primary" />
      </div>
      <Card className="mt-8">
        <p className="text-slate-600">
          {stats
            ? `${stats.tents} tents · ${stats.guides} guides · ${stats.drivers} drivers · ${stats.enquiries} new enquiries · ${stats.pendingKyc} pending KYC`
            : 'Connect to the API to view live platform stats.'}
        </p>
      </Card>
    </div>
  );
}
