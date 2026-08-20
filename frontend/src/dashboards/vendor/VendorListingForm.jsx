import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import {
  ROLE_CREATE_VERTICALS,
  ROLE_DEFAULT_VERTICAL,
  createVendorListing,
  fetchMyVendorListing,
  updateVendorListing,
} from '../../services/vendorListingsApi';
import {
  AMENITY_OPTIONS,
  PRODUCT_UNITS,
  ROOM_TYPES,
  VEHICLE_TYPES,
  VERTICAL_LABEL_KEY,
  defaultRoom,
  defaultRoute,
  defaultsFor,
  toFormValues,
  toPayload,
  validateListingForm,
} from './vendorListingFormConfig';
import HotelResortRegistrationFields from './HotelResortRegistrationFields';
import { listingStatusBadgeColor, listingStatusI18nKey, listingStatusOf, canVendorEditListing } from '../../utils/listingStatus';

const LISTINGS_PATH = '/dashboard/vendor/listings';

export default function VendorListingForm() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { vertical: verticalParam, id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);

  const allowedVerticals = ROLE_CREATE_VERTICALS[user?.role] || [];
  const requested = String(verticalParam || searchParams.get('type') || ROLE_DEFAULT_VERTICAL[user?.role] || '')
    .toUpperCase();
  const vertical = allowedVerticals.includes(requested) ? requested : allowedVerticals[0];

  const [form, setForm] = useState(() => defaultsFor(vertical));
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) return;
    setForm(defaultsFor(vertical));
  }, [isEdit, vertical]);

  useEffect(() => {
    if (!isEdit || !vertical || !id) return;
    setLoading(true);
    fetchMyVendorListing(vertical, id)
      .then((doc) => {
        if (!canVendorEditListing({ ...doc, vertical })) {
          toast.error(t('vendor.listingEditLocked'));
          navigate(LISTINGS_PATH, { replace: true });
          return;
        }
        setForm(toFormValues(vertical, doc));
      })
      .catch(() => {
        toast.error(t('vendor.listingLoadFailed'));
        navigate(LISTINGS_PATH, { replace: true });
      })
      .finally(() => setLoading(false));
  }, [isEdit, vertical, id, navigate, t]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateRow = (key, index, patch) => {
    setForm((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  };

  const addRow = (key, factory) => {
    setForm((prev) => ({ ...prev, [key]: [...(prev[key] || []), factory()] }));
  };

  const removeRow = (key, index) => {
    setForm((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== index),
    }));
  };

  const toggleAmenity = (name) => {
    setForm((prev) => {
      const amenities = prev.amenities || [];
      return {
        ...prev,
        amenities: amenities.includes(name) ? amenities.filter((a) => a !== name) : [...amenities, name],
      };
    });
  };

  const title = useMemo(() => {
    const kind = t(VERTICAL_LABEL_KEY[vertical] || 'vendor.listings');
    return isEdit ? t('vendor.editListing', { kind }) : t('vendor.createListingKind', { kind });
  }, [isEdit, t, vertical]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const saveVertical =
      vertical === 'HOTEL' || vertical === 'RESORT'
        ? form.type === 'RESORT'
          ? 'RESORT'
          : 'HOTEL'
        : vertical;
    const errorMessage = validateListingForm(saveVertical, form, { isCreate: !isEdit });
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(saveVertical, form);
      if (isEdit) {
        await updateVendorListing(vertical, id, payload);
        toast.success(t('vendor.listingUpdated'));
      } else {
        await createVendorListing(saveVertical, payload);
        toast.success(t('vendor.listingCreated'));
      }
      navigate(LISTINGS_PATH);
    } catch (err) {
      toast.error(err.response?.data?.message || t('vendor.listingSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (!vertical) {
    return <Card className="p-8 text-center text-slate-500">{t('vendor.listingsLoadFailed')}</Card>;
  }

  if (loading) return <Skeleton className="h-48" />;

  const isHotelResort = vertical === 'HOTEL' || vertical === 'RESORT';
  const showAmenities = ['HOMESTAY', 'TENT'].includes(vertical);
  const showRooms = vertical === 'HOMESTAY';
  const isOnboarding = searchParams.get('onboarding') === '1';

  return (
    <div>
      <Link to={LISTINGS_PATH} className="text-sm font-medium text-primary hover:underline">
        {t('common.back')}
      </Link>
      <h2 className="mt-4 text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {isHotelResort
          ? 'Complete the hotel/resort registration form. Your listing stays pending until admin approval.'
          : t('vendor.listingFormHint')}
      </p>
      {isOnboarding && isHotelResort && (
        <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
          Welcome. Finish this registration form to submit your property. You can upload KYC documents anytime from the KYC page.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        {isEdit && (
          <Card>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span>{t('common.status')}</span>
              <Badge color={listingStatusBadgeColor(listingStatusOf(form))}>
                {t(listingStatusI18nKey(listingStatusOf(form)))}
              </Badge>
            </div>
          </Card>
        )}

        {isHotelResort ? (
          <HotelResortRegistrationFields
            form={form}
            setField={setField}
            toggleAmenity={toggleAmenity}
            isEdit={isEdit}
          />
        ) : (
          <>
        {!isEdit && allowedVerticals.length > 1 && (
          <Card>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('vendor.vendorType')}</label>
            <select
              className="input-field max-w-xs"
              value={vertical}
              onChange={(e) => navigate(`${LISTINGS_PATH}/new?type=${e.target.value}`)}
            >
              {allowedVerticals.map((value) => (
                <option key={value} value={value}>
                  {t(VERTICAL_LABEL_KEY[value])}
                </option>
              ))}
            </select>
          </Card>
        )}

        <Card className="grid gap-4 sm:grid-cols-2">
          <Input
            className="sm:col-span-2"
            label={t('vendor.businessName')}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />

          {vertical === 'PRODUCT' && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('vendor.productVertical')}</label>
                <select className="input-field" value={form.vertical} onChange={(e) => setField('vertical', e.target.value)}>
                  <option value="STRAWBERRY">Strawberry</option>
                  <option value="MAPRO">Mapro</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('vendor.unit')}</label>
                <select className="input-field" value={form.unit} onChange={(e) => setField('unit', e.target.value)}>
                  {PRODUCT_UNITS.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <Input label={t('vendor.priceInr')} type="number" min="1" value={form.price} onChange={(e) => setField('price', e.target.value)} />
              <Input label={t('vendor.stock')} type="number" min="0" value={form.stock} onChange={(e) => setField('stock', e.target.value)} />
              <Input
                className="sm:col-span-2"
                label={t('vendor.shortDescription')}
                value={form.shortDescription}
                onChange={(e) => setField('shortDescription', e.target.value)}
              />
            </>
          )}

          {vertical === 'GUIDE' && (
            <>
              <Input className="sm:col-span-2" label={t('vendor.bio')} value={form.bio} onChange={(e) => setField('bio', e.target.value)} />
              <Input label={t('vendor.languages')} value={form.languages} onChange={(e) => setField('languages', e.target.value)} />
              <Input label={t('vendor.specialties')} value={form.specialties} onChange={(e) => setField('specialties', e.target.value)} />
              <Input label={t('vendor.package6hr')} type="number" min="1" value={form.package6hr} onChange={(e) => setField('package6hr', e.target.value)} />
              <Input label={t('vendor.package12hr')} type="number" min="1" value={form.package12hr} onChange={(e) => setField('package12hr', e.target.value)} />
              <Input label={t('vendor.bikeAddon')} type="number" min="0" value={form.bikeAddonPrice} onChange={(e) => setField('bikeAddonPrice', e.target.value)} />
            </>
          )}

          {vertical === 'TAXI' && (
            <>
              <Input label={t('vendor.phone')} value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('vendor.vehicleType')}</label>
                <select className="input-field" value={form.vehicleType} onChange={(e) => setField('vehicleType', e.target.value)}>
                  {VEHICLE_TYPES.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
              <Input label={t('vendor.vehicleNumber')} value={form.vehicleNumber} onChange={(e) => setField('vehicleNumber', e.target.value)} />
              <Input label={t('vendor.perTrip')} type="number" min="0" value={form.perTripPrice} onChange={(e) => setField('perTripPrice', e.target.value)} />
              <Input label={t('vendor.hourlyRate')} type="number" min="0" value={form.hourlyRate} onChange={(e) => setField('hourlyRate', e.target.value)} />
            </>
          )}

          {vertical === 'TENT' && (
            <>
              <Input label={t('vendor.location')} value={form.location} onChange={(e) => setField('location', e.target.value)} />
              <Input label={t('vendor.pricePerNight')} type="number" min="1" value={form.pricePerNight} onChange={(e) => setField('pricePerNight', e.target.value)} />
              <Input label={t('vendor.capacity')} type="number" min="1" value={form.capacity} onChange={(e) => setField('capacity', e.target.value)} />
              <Input label={t('vendor.totalTents')} type="number" min="1" value={form.totalTents} onChange={(e) => setField('totalTents', e.target.value)} />
            </>
          )}

          {vertical === 'HOMESTAY' && (
            <>
              <Input label={t('vendor.location')} value={form.location} onChange={(e) => setField('location', e.target.value)} />
              <Input label={t('vendor.phone')} value={form.contactPhone} onChange={(e) => setField('contactPhone', e.target.value)} />
            </>
          )}

          {vertical === 'HORSE' && (
            <Input label={t('vendor.location')} value={form.location} onChange={(e) => setField('location', e.target.value)} />
          )}

          {form.description !== undefined && vertical !== 'GUIDE' && vertical !== 'TAXI' && vertical !== 'PRODUCT' && (
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('vendor.description')}</label>
              <textarea
                className="input-field min-h-[88px]"
                value={form.description || ''}
                onChange={(e) => setField('description', e.target.value)}
              />
            </div>
          )}

          {form.imageUrl !== undefined && (
            <Input
              className="sm:col-span-2"
              label={t('vendor.imageUrl')}
              value={form.imageUrl}
              onChange={(e) => setField('imageUrl', e.target.value)}
              placeholder="https://"
            />
          )}
        </Card>
          </>
        )}

        {showAmenities && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-900">{t('vendor.amenities')}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((name) => {
                const on = (form.amenities || []).includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleAmenity(name)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      on ? 'bg-blue-50 text-primary' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {showRooms && (
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">{t('vendor.rooms')}</h3>
              <Button type="button" variant="outline" className="px-3 py-1.5 text-sm" onClick={() => addRow('rooms', defaultRoom)}>
                <Plus size={14} /> {t('vendor.addRoom')}
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              {(form.rooms || []).map((room, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Input label={t('vendor.roomName')} value={room.name} onChange={(e) => updateRow('rooms', index, { name: e.target.value })} />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('vendor.roomType')}</label>
                    <select
                      className="input-field"
                      value={room.type}
                      onChange={(e) => updateRow('rooms', index, { type: e.target.value })}
                    >
                      {ROOM_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <Input label={t('vendor.priceInr')} type="number" min="1" value={room.basePrice} onChange={(e) => updateRow('rooms', index, { basePrice: e.target.value })} />
                  <Input label={t('vendor.capacity')} type="number" min="1" value={room.capacity} onChange={(e) => updateRow('rooms', index, { capacity: e.target.value })} />
                  <div className="flex items-end gap-2">
                    <Input
                      className="flex-1"
                      label={t('vendor.totalRooms')}
                      type="number"
                      min="1"
                      value={room.totalRooms}
                      onChange={(e) => updateRow('rooms', index, { totalRooms: e.target.value })}
                    />
                    {(form.rooms || []).length > 1 && (
                      <button type="button" className="mb-0.5 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => removeRow('rooms', index)} aria-label={t('vendor.remove')}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {vertical === 'HORSE' && (
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">{t('vendor.routes')}</h3>
              <Button type="button" variant="outline" className="px-3 py-1.5 text-sm" onClick={() => addRow('routes', defaultRoute)}>
                <Plus size={14} /> {t('vendor.addRoute')}
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              {(form.routes || []).map((route, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-3">
                  <Input label={t('vendor.routeName')} value={route.name} onChange={(e) => updateRow('routes', index, { name: e.target.value })} />
                  <Input label={t('vendor.durationMinutes')} type="number" min="1" value={route.durationMinutes} onChange={(e) => updateRow('routes', index, { durationMinutes: e.target.value })} />
                  <div className="flex items-end gap-2">
                    <Input
                      className="flex-1"
                      label={t('vendor.priceInr')}
                      type="number"
                      min="1"
                      value={route.price}
                      onChange={(e) => updateRow('routes', index, { price: e.target.value })}
                    />
                    {(form.routes || []).length > 1 && (
                      <button type="button" className="mb-0.5 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => removeRow('routes', index)} aria-label={t('vendor.remove')}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>{saving ? t('common.loading') : t('common.save')}</Button>
          <Link to={LISTINGS_PATH} className="btn-outline inline-flex items-center">{t('common.cancel')}</Link>
        </div>
      </form>
    </div>
  );
}
