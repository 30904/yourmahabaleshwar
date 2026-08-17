import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { fetchComboBySlug } from '../../services/listingsApi';
import { createComboBooking } from '../../services/bookingsApi';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import Seo from '../../components/seo/Seo';
import { firstImageUrl, truncateMeta } from '../../constants/seo';

export default function ComboDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [checkIn, setCheckIn] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchComboBySlug(slug)
      .then(setItem)
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const book = async () => {
    if (!isAuthenticated) {
      toast.error(t('auth.signIn'));
      navigate('/login');
      return;
    }
    setBooking(true);
    try {
      const created = await createComboBooking({ comboId: item._id, checkIn });
      toast.success(created.bookingNumber || t('shop.orderCreated'));
      navigate('/dashboard/customer/bookings');
    } catch (e) {
      toast.error(e.response?.data?.message || t('common.loading'));
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="page-container py-12"><Skeleton className="h-80" /></div>;
  if (!item) return <div className="page-container py-12 text-slate-500">{t('shop.empty')}</div>;

  return (
    <div className="page-container py-10">
      <Seo
        title={item.name}
        description={truncateMeta(item.description || `${item.name} — combo offer in Mahabaleshwar.`)}
        image={firstImageUrl(item.images) || '/logo.png'}
        type="website"
      />
      <img
        src={item.images?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200'}
        alt={item.name}
        className="h-64 w-full rounded-2xl object-cover"
      />
      <h1 className="mt-6 text-3xl font-bold">{item.name}</h1>
      <p className="mt-2 text-slate-600">{item.description}</p>
      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <span className="text-2xl font-extrabold text-primary">{formatCurrency(item.comboPrice)}</span>
        <span className="text-slate-400 line-through">{formatCurrency(item.originalPrice)}</span>
      </div>
      <ul className="mt-6 space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        {(item.items || []).map((it, i) => (
          <li key={i} className="text-sm text-slate-700">
            <span className="font-semibold">{it.itemType}</span> — {it.label || it.itemId}
            {it.quantity > 1 ? ` × ${it.quantity}` : ''}
            {it.nights ? ` · ${it.nights} night(s)` : ''}
          </li>
        ))}
      </ul>
      <label className="mt-6 block text-sm font-medium">
        {t('booking.checkIn')}
        <input
          type="date"
          className="mt-1 rounded-lg border border-slate-200 px-3 py-2"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
        />
      </label>
      <Button className="mt-6" onClick={book} disabled={booking}>
        {booking ? t('common.loading') : t('shop.bookCombo')}
      </Button>
    </div>
  );
}
