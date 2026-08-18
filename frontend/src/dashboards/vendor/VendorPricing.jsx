import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  fetchMyVendorListing,
  fetchMyVendorListings,
  patchVendorListingPrices,
} from '../../services/vendorListingsApi';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import {
  pricingDraftFromListing,
  pricingPayloadFromDraft,
  validatePricingDraft,
} from './vendorPricingForm';

const listingKey = (item) => `${item.vertical}-${item.id}`;

export default function VendorPricing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.role) return;
    setLoading(true);
    fetchMyVendorListings(user.role)
      .then(async (list) => {
        const details = await Promise.all(
          list.map(async (item) => {
            try {
              const detail = await fetchMyVendorListing(item.vertical, item.id);
              return { ...item, detail };
            } catch {
              return { ...item, detail: item };
            }
          })
        );
        const nextDrafts = {};
        details.forEach((item) => {
          nextDrafts[listingKey(item)] = pricingDraftFromListing(item.vertical, item.detail || item);
        });
        setRows(details);
        setDrafts(nextDrafts);
      })
      .catch(() => {
        setRows([]);
        toast.error(t('vendor.listingsLoadFailed'));
      })
      .finally(() => setLoading(false));
  }, [user?.role, t]);

  const setDraft = (key, patch) => {
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const setRowField = (key, field, value, index) => {
    setDrafts((prev) => {
      const current = prev[key] || {};
      if (field === 'rooms' || field === 'routes') {
        const list = [...(current[field] || [])];
        list[index] = { ...list[index], ...value };
        return { ...prev, [key]: { ...current, [field]: list } };
      }
      return { ...prev, [key]: { ...current, [field]: value } };
    });
  };

  const onSave = async (item) => {
    const key = listingKey(item);
    const draft = drafts[key];
    const invalid = validatePricingDraft(item.vertical, draft);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await patchVendorListingPrices(item.vertical, item.id, pricingPayloadFromDraft(item.vertical, draft));
      toast.success(t('vendor.pricingSaved'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('vendor.pricingSaveFailed'));
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading) return <Skeleton className="h-48" />;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">{t('vendor.pricing')}</h2>
      <p className="mt-1 text-sm text-slate-500">{t('vendor.pricingHint')}</p>

      {!rows.length ? (
        <Card className="mt-6 p-8 text-center">
          <p className="text-slate-500">{t('vendor.noPricingListings')}</p>
          <Link to="/dashboard/vendor/listings/new" className="btn-primary mt-4 inline-flex">
            {t('vendor.createListing')}
          </Link>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((item) => {
            const key = listingKey(item);
            const draft = drafts[key] || {};
            return (
              <Card key={key}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <p className="text-xs text-slate-500">{t(item.labelKey)}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <PricingFields
                    vertical={item.vertical}
                    draft={draft}
                    t={t}
                    onField={(field, value) => setDraft(key, { [field]: value })}
                    onRow={(field, index, value) => setRowField(key, field, value, index)}
                  />
                </div>
                <div className="mt-4">
                  <Button type="button" disabled={saving[key]} onClick={() => onSave(item)}>
                    {saving[key] ? t('common.loading') : t('vendor.savePrices')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PricingFields({ vertical, draft, t, onField, onRow }) {
  if (vertical === 'HOTEL' || vertical === 'RESORT' || vertical === 'HOMESTAY') {
    if (!draft.rooms?.length) {
      return <p className="text-sm text-slate-500 sm:col-span-2">{t('vendor.pricingNeedRooms')}</p>;
    }
    return draft.rooms.map((room, index) => (
      <Input
        key={room.id || index}
        label={`${room.name} (₹)`}
        type="number"
        min="1"
        value={room.basePrice}
        onChange={(e) => onRow('rooms', index, { basePrice: e.target.value })}
      />
    ));
  }
  if (vertical === 'TENT') {
    return (
      <Input
        label={t('vendor.pricePerNight')}
        type="number"
        min="1"
        value={draft.pricePerNight}
        onChange={(e) => onField('pricePerNight', e.target.value)}
      />
    );
  }
  if (vertical === 'GUIDE') {
    return (
      <>
        <Input label={t('vendor.package6hr')} type="number" min="1" value={draft.package6hr} onChange={(e) => onField('package6hr', e.target.value)} />
        <Input label={t('vendor.package12hr')} type="number" min="1" value={draft.package12hr} onChange={(e) => onField('package12hr', e.target.value)} />
        <Input label={t('vendor.bikeAddon')} type="number" min="0" value={draft.bikeAddonPrice} onChange={(e) => onField('bikeAddonPrice', e.target.value)} />
      </>
    );
  }
  if (vertical === 'TAXI') {
    return (
      <>
        <Input label={t('vendor.perTrip')} type="number" min="1" value={draft.perTripPrice} onChange={(e) => onField('perTripPrice', e.target.value)} />
        <Input label={t('vendor.hourlyRate')} type="number" min="1" value={draft.hourlyRate} onChange={(e) => onField('hourlyRate', e.target.value)} />
      </>
    );
  }
  if (vertical === 'HORSE') {
    if (!draft.routes?.length) {
      return <p className="text-sm text-slate-500 sm:col-span-2">{t('vendor.pricingNeedRoutes')}</p>;
    }
    return draft.routes.map((route, index) => (
      <Input
        key={route.id || index}
        label={`${route.name} (₹)`}
        type="number"
        min="1"
        value={route.price}
        onChange={(e) => onRow('routes', index, { price: e.target.value })}
      />
    ));
  }
  return (
    <>
      <Input label={t('vendor.priceInr')} type="number" min="1" value={draft.price} onChange={(e) => onField('price', e.target.value)} />
      <Input label={t('vendor.stock')} type="number" min="0" value={draft.stock} onChange={(e) => onField('stock', e.target.value)} />
    </>
  );
}
