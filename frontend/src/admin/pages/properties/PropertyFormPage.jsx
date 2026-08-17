import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CheckCircle2,
  Clock,
  Globe,
  MapPin,
  Plus,
  Save,
  Sparkles,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PropertyFormStepper from '../../components/properties/PropertyFormStepper';
import AmenityPicker from '../../components/properties/AmenityPicker';
import PropertyPhotoGallery from '../../components/properties/PropertyPhotoGallery';
import PropertyListingPreview from '../../components/properties/PropertyListingPreview';
import { FORM_STEPS, PROPERTY_TYPES } from '../../components/properties/propertyFormConfig';
import {
  createAdminProperty,
  fetchAdminProperty,
  updateAdminProperty,
  fetchAmenities,
  fetchRoomTypes,
} from '../../../services/enterpriseAdminApi';
import { formatCurrency } from '../../../utils/format';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

const defaultValues = {
  name: '',
  type: 'HOTEL',
  description: '',
  shortDescription: '',
  address: { line1: '', line2: '', city: 'Mahabaleshwar', state: 'Maharashtra', pincode: '' },
  location: { lat: '17.9307', lng: '73.6477' },
  rating: 4,
  isFeatured: false,
  isActive: true,
  checkInTime: '14:00',
  checkOutTime: '11:00',
  policies: 'Free cancellation up to 48 hours before check-in. No smoking in rooms.',
  commissionRate: 10,
  metaTitle: '',
  metaDescription: '',
  rooms: [
    { name: 'Standard Room', type: 'STANDARD', basePrice: 2500, capacity: 2, totalRooms: 5, description: '' },
  ],
};

const STEP_FIELDS = [
  ['name', 'type', 'description'],
  ['address.line1', 'address.city', 'address.pincode'],
  [],
  ['rooms'],
  [],
  [],
];

export default function PropertyFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [amenities, setAmenities] = useState([]);
  const [amenityOptions, setAmenityOptions] = useState([]);
  const [roomTypeOptions, setRoomTypeOptions] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const { register, handleSubmit, control, reset, watch, trigger, formState: { errors } } = useForm({
    defaultValues,
  });
  const { fields: roomFields, append, remove } = useFieldArray({ control, name: 'rooms' });
  const values = watch();

  useEffect(() => {
    setCatalogLoading(true);
    Promise.all([fetchAmenities({ active: 'true' }), fetchRoomTypes({ active: 'true' })])
      .then(([amenityList, roomTypeList]) => {
        setAmenityOptions(amenityList);
        setRoomTypeOptions(roomTypeList);
      })
      .catch(() => toast.error('Failed to load catalog data'))
      .finally(() => setCatalogLoading(false));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetchAdminProperty(id)
      .then(({ hotel, rooms }) => {
        reset({
          name: hotel.name || '',
          type: hotel.type || 'HOTEL',
          description: hotel.description || '',
          shortDescription: hotel.shortDescription || '',
          address: {
            line1: hotel.address?.line1 || '',
            line2: hotel.address?.line2 || '',
            city: hotel.address?.city || 'Mahabaleshwar',
            state: hotel.address?.state || 'Maharashtra',
            pincode: hotel.address?.pincode || '',
          },
          location: {
            lat: hotel.location?.lat?.toString() || '17.9307',
            lng: hotel.location?.lng?.toString() || '73.6477',
          },
          rating: hotel.rating ?? 4,
          isFeatured: Boolean(hotel.isFeatured),
          isActive: hotel.isActive !== false,
          checkInTime: hotel.checkInTime || '14:00',
          checkOutTime: hotel.checkOutTime || '11:00',
          policies: hotel.policies || defaultValues.policies,
          commissionRate: hotel.commissionRate ?? 10,
          metaTitle: '',
          metaDescription: '',
          rooms: rooms?.length
            ? rooms.map((r) => ({
                name: r.name,
                type: r.type || 'STANDARD',
                basePrice: r.basePrice,
                capacity: r.capacity ?? 2,
                totalRooms: r.totalRooms ?? 5,
                description: r.description || '',
              }))
            : defaultValues.rooms,
        });
        setAmenities(hotel.amenities || []);
        setGallery(hotel.images || []);
        setCompletedSteps([0, 1, 2, 3, 4, 5]);
      })
      .catch(() => toast.error('Failed to load property'))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset]);

  const progress = Math.round(((activeStep + 1) / FORM_STEPS.length) * 100);

  const orderedImages = useMemo(() => {
    if (!gallery.length) return [];
    const arr = [...gallery];
    if (coverIndex > 0 && coverIndex < arr.length) {
      const [cover] = arr.splice(coverIndex, 1);
      arr.unshift(cover);
    }
    return arr;
  }, [gallery, coverIndex]);

  const goNext = async () => {
    const fields = STEP_FIELDS[activeStep];
    if (fields.length) {
      const ok = await trigger(fields);
      if (!ok) {
        toast.error('Please complete required fields');
        return;
      }
    }
    if (activeStep === 3) {
      const roomValidateFields = roomFields.flatMap((_, i) => [
        `rooms.${i}.name`,
        `rooms.${i}.basePrice`,
      ]);
      const ok = await trigger(roomValidateFields);
      if (!ok) {
        toast.error('Enter room name and price for each room type');
        return;
      }
    }
    if (activeStep === 4 && gallery.length < 1) {
      toast.error('Upload at least one photo');
      return;
    }
    setCompletedSteps((s) => (s.includes(activeStep) ? s : [...s, activeStep]));
    setActiveStep((s) => Math.min(s + 1, FORM_STEPS.length - 1));
  };

  const goBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data) => {
    if (gallery.length < 1) {
      toast.error('Upload at least one property photo');
      setActiveStep(4);
      return;
    }
    setSaving(true);
    const payload = {
      name: data.name.trim(),
      type: data.type,
      description: data.description,
      shortDescription: data.shortDescription,
      address: data.address,
      amenities,
      images: orderedImages.length ? orderedImages : [DEFAULT_IMAGE],
      rating: Number(data.rating),
      commissionRate: Number(data.commissionRate) || 10,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      policies: data.policies,
      location: {
        lat: Number(data.location?.lat) || 17.9307,
        lng: Number(data.location?.lng) || 73.6477,
      },
      rooms: data.rooms.map((r) => ({
        name: r.name,
        type: r.type || 'STANDARD',
        description: r.description,
        basePrice: Number(r.basePrice),
        capacity: Number(r.capacity) || 2,
        totalRooms: Number(r.totalRooms) || 5,
      })),
    };
    try {
      if (isEdit) await updateAdminProperty(id, payload);
      else await createAdminProperty(payload);
      toast.success(isEdit ? 'Property updated successfully' : 'Property published to platform');
      navigate('/admin/properties');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <section className="admin-prop-section">
            <div className="admin-prop-section-head">
              <Sparkles className="text-admin-primary" size={22} />
              <div>
                <h3>Property basics</h3>
                <p>How your listing appears in search results</p>
              </div>
            </div>
            <label className="admin-label">Property name *
              <input className="admin-input" placeholder="e.g. Valley View Resort & Spa" {...register('name', { required: 'Name is required' })} />
              {errors.name && <span className="admin-field-error">{errors.name.message}</span>}
            </label>
            <div className="admin-type-cards">
              {PROPERTY_TYPES.map((t) => (
                <label key={t.value} className={`admin-type-card ${values.type === t.value ? 'admin-type-card-active' : ''}`}>
                  <input type="radio" value={t.value} className="sr-only" {...register('type')} />
                  <span className="font-semibold">{t.label}</span>
                  <span className="text-xs text-slate-500">{t.desc}</span>
                </label>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="admin-label">Star rating
                <input type="number" step="0.1" min="1" max="5" className="admin-input" {...register('rating')} />
              </label>
              <label className="admin-label">Commission %
                <input type="number" className="admin-input" {...register('commissionRate')} />
              </label>
            </div>
            <label className="admin-label">Short tagline
              <input className="admin-input" placeholder="Boutique stay with valley views" {...register('shortDescription')} />
            </label>
            <label className="admin-label">Full description *
              <textarea rows={5} className="admin-input" placeholder="Describe rooms, views, dining, and what makes this property special..." {...register('description', { required: true })} />
            </label>
          </section>
        );

      case 1:
        return (
          <section className="admin-prop-section">
            <div className="admin-prop-section-head">
              <MapPin className="text-admin-primary" size={22} />
              <div>
                <h3>Location</h3>
                <p>Help guests find you on the map</p>
              </div>
            </div>
            <div className="admin-map-preview">
              <div className="admin-map-preview-pin" />
              <p className="text-sm font-medium text-slate-700">{values.address?.city || 'Mahabaleshwar'}, Maharashtra</p>
              <p className="text-xs text-slate-500">{values.address?.line1 || 'Enter address to preview pin'}</p>
            </div>
            <label className="admin-label">Street address *
              <input className="admin-input" {...register('address.line1', { required: true })} />
            </label>
            <label className="admin-label">Address line 2
              <input className="admin-input" placeholder="Landmark, lane" {...register('address.line2')} />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="admin-label">City *
                <input className="admin-input" {...register('address.city', { required: true })} />
              </label>
              <label className="admin-label">State
                <input className="admin-input" {...register('address.state')} />
              </label>
              <label className="admin-label">Pincode *
                <input className="admin-input" {...register('address.pincode', { required: true })} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="admin-label">Latitude
                <input className="admin-input" {...register('location.lat')} />
              </label>
              <label className="admin-label">Longitude
                <input className="admin-input" {...register('location.lng')} />
              </label>
            </div>
          </section>
        );

      case 2:
        return (
          <section className="admin-prop-section">
            <div className="admin-prop-section-head">
              <CheckCircle2 className="text-admin-primary" size={22} />
              <div>
                <h3>Amenities & policies</h3>
                <p>Select facilities guests care about most</p>
              </div>
            </div>
            <AmenityPicker
              options={amenityOptions}
              selected={amenities}
              onChange={setAmenities}
              loading={catalogLoading}
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="admin-label">
                <Clock size={14} className="inline mr-1" /> Check-in
                <input type="time" className="admin-input" {...register('checkInTime')} />
              </label>
              <label className="admin-label">
                <Clock size={14} className="inline mr-1" /> Check-out
                <input type="time" className="admin-input" {...register('checkOutTime')} />
              </label>
            </div>
            <label className="admin-label mt-4">House rules & cancellation
              <textarea rows={4} className="admin-input" {...register('policies')} />
            </label>
          </section>
        );

      case 3:
        return (
          <section className="admin-prop-section">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="admin-prop-section-head !mb-0">
                <BedDouble className="text-admin-primary" size={22} />
                <div>
                  <h3>Rooms & pricing</h3>
                  <p>Set room types and nightly rates</p>
                </div>
              </div>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => {
                  const rt = roomTypeOptions[1] || roomTypeOptions[0];
                  append({
                    name: rt ? `${rt.name} Room` : 'Deluxe Room',
                    type: rt?.code || 'DELUXE',
                    basePrice: 4500,
                    capacity: rt?.defaultCapacity ?? 2,
                    totalRooms: 3,
                    description: rt?.description || '',
                  });
                }}
              >
                <Plus size={16} /> Add room type
              </button>
            </div>
            <div className="mt-6 space-y-4">
              {roomFields.map((field, index) => (
                <div key={field.id} className="admin-room-card">
                  <div className="admin-room-card-header">
                    <span className="text-sm font-semibold text-slate-500">Room {index + 1}</span>
                    {roomFields.length > 1 && (
                      <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => remove(index)}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="admin-label sm:col-span-2">Room name
                      <input className="admin-input" {...register(`rooms.${index}.name`, { required: true })} />
                    </label>
                    <label className="admin-label">Type
                      <select className="admin-input" {...register(`rooms.${index}.type`)}>
                        {(roomTypeOptions.length
                          ? roomTypeOptions
                          : [{ code: 'STANDARD', name: 'Standard' }, { code: 'DELUXE', name: 'Deluxe' }]
                        ).map((t) => (
                          <option key={t.code} value={t.code}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-label">Price / night (₹)
                      <input type="number" className="admin-input" {...register(`rooms.${index}.basePrice`, { required: true })} />
                    </label>
                    <label className="admin-label">Max guests
                      <input type="number" className="admin-input" {...register(`rooms.${index}.capacity`)} />
                    </label>
                    <label className="admin-label">Units available
                      <input type="number" className="admin-input" {...register(`rooms.${index}.totalRooms`)} />
                    </label>
                    <label className="admin-label sm:col-span-2 lg:col-span-3">Description
                      <input className="admin-input" placeholder="King bed, balcony, valley view" {...register(`rooms.${index}.description`)} />
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    From {formatCurrency(Number(values.rooms?.[index]?.basePrice) || 0)} per night
                  </p>
                </div>
              ))}
            </div>
          </section>
        );

      case 4:
        return (
          <section className="admin-prop-section">
            <PropertyPhotoGallery
              images={gallery}
              coverIndex={coverIndex}
              onChange={setGallery}
              onCoverChange={setCoverIndex}
            />
          </section>
        );

      case 5:
        return (
          <section className="admin-prop-section space-y-6">
            <div className="admin-prop-section-head">
              <Globe className="text-admin-primary" size={22} />
              <div>
                <h3>Publish settings</h3>
                <p>SEO and visibility on YOURMAHABALESHWAR.COM</p>
              </div>
            </div>
            <label className="admin-label">Meta title
              <input className="admin-input" placeholder={values.name || 'SEO title'} {...register('metaTitle')} />
            </label>
            <label className="admin-label">Meta description
              <textarea rows={3} className="admin-input" {...register('metaDescription')} />
            </label>
            <div className="admin-publish-toggles">
              <label className="admin-publish-toggle">
                <input type="checkbox" {...register('isActive')} />
                <div>
                  <span className="font-semibold">Live on platform</span>
                  <span className="text-xs text-slate-500">Guests can search and book</span>
                </div>
              </label>
              <label className="admin-publish-toggle">
                <input type="checkbox" {...register('isFeatured')} />
                <div>
                  <span className="font-semibold">Featured listing</span>
                  <span className="text-xs text-slate-500">Show on homepage deals</span>
                </div>
              </label>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 size={18} className="mb-2 inline" /> Ready to publish — review the preview panel, then save.
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="admin-card flex min-h-[320px] items-center justify-center p-12 text-slate-500">
        Loading property...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="admin-property-form">
      <PageHeader
        title={isEdit ? 'Edit Property' : 'Add Property'}
        subtitle="List your hotel or resort on the platform"
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Properties', to: '/admin/properties' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Link to="/admin/properties" className="admin-btn-secondary">
            <ArrowLeft size={16} /> Back
          </Link>
        }
      />

      <div className="admin-prop-progress-bar">
        <div className="admin-prop-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-slate-500">Step {activeStep + 1} of {FORM_STEPS.length} · {FORM_STEPS[activeStep].label}</p>

      <PropertyFormStepper
        activeStep={activeStep}
        completedSteps={completedSteps}
        onStepClick={setActiveStep}
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="admin-card p-6 md:p-8">{renderStep()}</div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <PropertyListingPreview data={values} images={gallery} coverIndex={coverIndex} selectedAmenities={amenities} />
          <div className="admin-card p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Tips for higher bookings</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              <li>Use 8+ high-quality photos</li>
              <li>Write a unique description</li>
              <li>Enable free cancellation</li>
              <li>Keep rates competitive</li>
            </ul>
          </div>
        </aside>
      </div>

      <footer className="admin-prop-footer">
        <button type="button" className="admin-btn-secondary" onClick={goBack} disabled={activeStep === 0}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          {activeStep < FORM_STEPS.length - 1 ? (
            <button type="button" className="admin-btn-primary" onClick={goNext}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button type="submit" disabled={saving} className="admin-btn-primary">
              <Save size={16} /> {saving ? 'Publishing...' : isEdit ? 'Update property' : 'Publish property'}
            </button>
          )}
        </div>
      </footer>
    </form>
  );
}
