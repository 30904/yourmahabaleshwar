import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { fetchProductBySlug } from '../../services/listingsApi';
import { createProductOrder } from '../../services/bookingsApi';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import Seo from '../../components/seo/Seo';
import { firstImageUrl, truncateMeta } from '../../constants/seo';

export default function ProductDetailPage({ vertical = 'STRAWBERRY' }) {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    fetchProductBySlug(slug)
      .then(setItem)
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const order = async () => {
    if (!isAuthenticated) {
      toast.error(t('auth.signIn'));
      navigate('/login');
      return;
    }
    setOrdering(true);
    try {
      const booking = await createProductOrder({
        productId: item._id,
        quantity: qty,
        deliveryAddress: { phone: user?.phone, city: 'Mahabaleshwar', note: 'Local pickup/delivery' },
      });
      toast.success(booking.bookingNumber || t('shop.orderCreated'));
      navigate('/dashboard/customer/bookings');
    } catch (e) {
      toast.error(e.response?.data?.message || t('common.loading'));
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <div className="page-container py-12"><Skeleton className="h-80" /></div>;
  if (!item) return <div className="page-container py-12 text-slate-500">{t('shop.empty')}</div>;

  return (
    <div className="page-container grid gap-8 py-10 lg:grid-cols-2">
      <Seo
        title={item.name}
        description={truncateMeta(item.description || item.shortDescription || `${item.name} — ${vertical === 'MAPRO' ? 'Mapro' : 'strawberry'} product from Mahabaleshwar.`)}
        image={firstImageUrl(item.images) || '/logo.png'}
        type="website"
      />
      <img
        src={item.images?.[0] || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=900'}
        alt={item.name}
        className="h-80 w-full rounded-2xl object-cover"
      />
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">{vertical}</p>
        <h1 className="mt-2 text-3xl font-bold">{item.name}</h1>
        <p className="mt-3 text-slate-600">{item.description || item.shortDescription}</p>
        <p className="mt-4 text-2xl font-extrabold text-primary">
          {formatCurrency(item.price)} <span className="text-sm font-medium text-slate-500">/ {item.unit}</span>
        </p>
        <p className="mt-1 text-sm text-slate-500">{item.deliveryNote}</p>
        <label className="mt-6 block text-sm font-medium">
          {t('shop.quantity')}
          <input
            type="number"
            min={1}
            max={item.stock || 20}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
            className="mt-1 w-28 rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <Button className="mt-6" onClick={order} disabled={ordering}>
          {ordering ? t('common.loading') : t('shop.orderNow')}
        </Button>
      </div>
    </div>
  );
}
