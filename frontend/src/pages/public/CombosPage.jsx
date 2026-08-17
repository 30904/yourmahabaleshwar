import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Skeleton from '../../components/ui/Skeleton';
import { fetchCombos } from '../../services/listingsApi';
import { formatCurrency } from '../../utils/format';

export default function CombosPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCombos()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-background pb-16">
      <div className="bg-primary py-10 text-white">
        <div className="page-container">
          <h1 className="text-3xl font-bold">{t('shop.comboTitle')}</h1>
          <p className="mt-2 text-white/80">{t('shop.comboSub')}</p>
        </div>
      </div>
      <div className="page-container py-8 space-y-4">
        {loading && <Skeleton className="h-40" />}
        {items.map((c) => (
          <Link key={c._id} to={`/combos/${c.slug}`} className="card flex flex-col gap-4 p-4 sm:flex-row">
            <img
              src={c.images?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
              alt=""
              className="h-36 w-full rounded-xl object-cover sm:w-56"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold">{c.name}</h2>
              <p className="mt-1 text-sm text-slate-600 line-clamp-2">{c.description}</p>
              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span className="text-xl font-extrabold text-primary">{formatCurrency(c.comboPrice)}</span>
                <span className="text-sm text-slate-400 line-through">{formatCurrency(c.originalPrice)}</span>
                <span className="text-xs font-semibold text-emerald-700">
                  {t('shop.save')} {formatCurrency((c.originalPrice || 0) - (c.comboPrice || 0))}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {!loading && items.length === 0 && <p className="text-slate-500">{t('shop.empty')}</p>}
      </div>
    </div>
  );
}
