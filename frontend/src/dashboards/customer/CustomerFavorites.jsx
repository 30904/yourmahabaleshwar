import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchWishlist, removeFromWishlist } from '../../services/userApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { formatCurrency } from '../../utils/format';

const linkFor = (type, slug) => {
  const map = {
    HOTEL: '/hotels',
    RESORT: '/resorts',
    HOMESTAY: '/homestays',
    TENT: '/tents',
    GUIDE: '/guides',
    TAXI: '/taxi',
    HORSE: '/horses',
  };
  return `${map[type] || '/hotels'}/${slug}`;
};

export default function CustomerFavorites() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchWishlist()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Skeleton className="h-40" />;

  return (
    <div>
      <h2 className="text-xl font-bold">{t('booking.favorites')}</h2>
      <p className="mt-1 text-sm text-slate-500">Saved stays and experiences</p>
      <div className="mt-6 space-y-3">
        {!items.length && <Card className="p-8 text-center text-slate-500">No favorites yet.</Card>}
        {items.map(({ item, itemType }) => (
          <Card key={`${itemType}-${item._id}`} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link to={linkFor(itemType, item.slug)} className="font-semibold text-primary hover:underline">
                {item.name}
              </Link>
              <p className="text-sm text-slate-500">{itemType} · {formatCurrency(item.priceFrom || item.pricePerNight || item.package6hr || item.perTripPrice)}</p>
            </div>
            <Button
              variant="outline"
              className="px-3 py-1.5 text-sm"
              onClick={async () => {
                await removeFromWishlist(item._id, itemType);
                load();
              }}
            >
              Remove
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
