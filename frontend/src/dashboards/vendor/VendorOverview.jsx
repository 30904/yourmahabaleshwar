import { useEffect, useState } from 'react';
import { Calendar, Star, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import CurrencyIcon from '../../components/common/CurrencyIcon';
import { fetchVendorBookings } from '../../services/bookingsApi';
import { formatCurrency } from '../../utils/format';

export default function VendorOverview() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorBookings()
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-48" />;

  const revenue = bookings.reduce((sum, b) => sum + (b.total || 0), 0);
  const pending = bookings.filter((b) => b.status === 'PENDING').length;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">{t('vendor.overview')}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Calendar} label={t('vendor.bookings')} value={String(bookings.length)} color="primary" />
        <StatCard icon={CurrencyIcon} label={t('vendor.revenue')} value={formatCurrency(revenue)} color="primary" />
        <StatCard icon={Star} label={t('vendor.pending')} value={String(pending)} color="primary" />
        <StatCard icon={FileText} label="KYC" value="View" color="primary" />
      </div>
      <Card className="mt-8">
        <p className="text-slate-600">{t('vendor.overviewHint')}</p>
      </Card>
    </div>
  );
}
