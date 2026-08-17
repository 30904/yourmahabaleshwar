import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Skeleton from '../../components/ui/Skeleton';
import { fetchProducts } from '../../services/listingsApi';
import { formatCurrency } from '../../utils/format';

export default function ProductsPage({ vertical = 'STRAWBERRY' }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMapro = vertical === 'MAPRO';
  const base = isMapro ? '/mapro' : '/strawberries';

  useEffect(() => {
    setLoading(true);
    fetchProducts({ vertical, limit: 50 })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [vertical]);

  return (
    <div className="bg-background pb-16">
      <div className="bg-primary py-10 text-white">
        <div className="page-container">
          <h1 className="text-3xl font-bold">
            {isMapro ? t('shop.maproTitle') : t('shop.strawberryTitle')}
          </h1>
          <p className="mt-2 text-white/80">
            {isMapro ? t('shop.maproSub') : t('shop.strawberrySub')}
          </p>
        </div>
      </div>
      <div className="page-container py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading && <Skeleton className="h-64 sm:col-span-2 lg:col-span-3" />}
          {!loading &&
            items.map((p) => (
              <Link key={p._id} to={`${base}/${p.slug}`} className="card overflow-hidden hover:shadow-md">
                <img
                  src={p.images?.[0] || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600'}
                  alt=""
                  className="h-44 w-full object-cover"
                />
                <div className="p-4">
                  <h2 className="font-bold text-slate-900">{p.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.shortDescription}</p>
                  <p className="mt-3 text-lg font-extrabold text-primary">
                    {formatCurrency(p.price)}
                    <span className="ml-1 text-xs font-medium text-slate-500">/ {p.unit}</span>
                  </p>
                </div>
              </Link>
            ))}
        </div>
        {!loading && items.length === 0 && (
          <p className="text-slate-500">{t('shop.empty')}</p>
        )}
      </div>
    </div>
  );
}
